from __future__ import annotations

import ipaddress
import shutil
import subprocess
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field

from app.models import DeviceType


QUICK_PORTS = [
    22,
    53,
    80,
    81,
    139,
    443,
    445,
    631,
    2049,
    3000,
    3001,
    5055,
    5666,
    8000,
    8005,
    8006,
    8096,
    8840,
    9000,
    9443,
    51821,
    62078,
]


@dataclass
class ScannedDevice:
    ip: str
    mac: str | None = None
    vendor: str | None = None
    hostname: str | None = None
    ports: list[int] = field(default_factory=list)
    os_guess: str | None = None
    device_type: DeviceType = DeviceType.unknown
    is_network_node: bool = False


def _run_nmap(args: list[str], timeout: int = 180) -> str:
    if shutil.which("nmap") is None:
        raise RuntimeError("nmap is not installed in this container")
    proc = subprocess.run(
        ["nmap", *args],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout,
        check=False,
    )
    if proc.returncode not in (0, 1):
        raise RuntimeError(proc.stderr.strip() or "nmap failed")
    return proc.stdout


def _parse_discovery(xml_text: str) -> list[ScannedDevice]:
    root = ET.fromstring(xml_text)
    devices: list[ScannedDevice] = []
    for host in root.findall("host"):
        status = host.find("status")
        if status is not None and status.attrib.get("state") != "up":
            continue
        ipv4 = host.find("address[@addrtype='ipv4']")
        if ipv4 is None:
            continue
        mac = host.find("address[@addrtype='mac']")
        hostname = host.find("./hostnames/hostname")
        devices.append(
            ScannedDevice(
                ip=ipv4.attrib["addr"],
                mac=mac.attrib.get("addr").lower() if mac is not None and mac.attrib.get("addr") else None,
                vendor=mac.attrib.get("vendor") if mac is not None else None,
                hostname=hostname.attrib.get("name") if hostname is not None else None,
            )
        )
    return devices


def _parse_ports(xml_text: str) -> dict[str, list[int]]:
    root = ET.fromstring(xml_text)
    by_ip: dict[str, list[int]] = {}
    for host in root.findall("host"):
        ipv4 = host.find("address[@addrtype='ipv4']")
        if ipv4 is None:
            continue
        ports: list[int] = []
        for port in host.findall("./ports/port"):
            state = port.find("state")
            if state is not None and state.attrib.get("state") == "open":
                ports.append(int(port.attrib["portid"]))
        by_ip[ipv4.attrib["addr"]] = sorted(ports)
    return by_ip


# Heuristic rules for device type inference.
# Order matters: first match wins.
HEURISTICS = [
    # Network Infrastructure (is_network_node=True)
    {"type": DeviceType.router, "is_node": True, "host_number": 1},
    {"type": DeviceType.router, "is_node": True, "ports_all": [53, 80, 443]},
    {"type": DeviceType.access_point, "is_node": True, "vendor": ["ubiquiti", "unifi", "aruba"]},
    {"type": DeviceType.access_point, "is_node": True, "hostname": ["ap-", "unifi-ap"]},
    
    # IoT & Home Automation (High priority as they often have ambiguous names)
    {"type": DeviceType.iot, "is_node": False, "hostname": ["esp-", "shelly", "sonoff", "tasmota", "zigbee", "tuya", "aqara"]},
    {"type": DeviceType.iot, "is_node": False, "vendor": ["espressif", "tuya", "yeelight"]},
    {"type": DeviceType.camera, "is_node": False, "hostname": ["camera", "cam-", "ipc-", "reolink"]},
    {"type": DeviceType.camera, "is_node": False, "vendor": ["hikvision", "dahua", "amcrest", "reolink", "foscam", "axis"]},

    # Infrastructure Cont.
    {"type": DeviceType.switch, "is_node": True, "hostname": ["switch-", "sw-", "tplink-sw"]},
    {"type": DeviceType.switch, "is_node": True, "vendor": ["tp-link"], "hostname": ["switch"]},
    
    # Servers & Storage
    {"type": DeviceType.nas, "is_node": False, "ports_any": [2049, 8096, 9000, 5000, 5001]},
    {"type": DeviceType.nas, "is_node": False, "vendor": ["synology", "qnap", "asustor", "terramaster"]},
    {"type": DeviceType.server, "is_node": False, "ports_any": [8006, 2222, 10000]},
    {"type": DeviceType.server, "is_node": False, "hostname": ["pve", "proxmox", "esxi", "unraid", "truenas", "server"]},
    
    # Multimedia & Entertainment
    {"type": DeviceType.media, "is_node": False, "ports_any": [8008, 8443, 32400]},
    {"type": DeviceType.media, "is_node": False, "hostname": ["kodi", "plex", "shield", "apple-tv", "chromecast", "roku"]},
    {"type": DeviceType.media, "is_node": False, "vendor": ["sonos", "denon", "marantz", "roku", "nvidia"]},
    
    # Personal Devices
    {"type": DeviceType.phone, "is_node": False, "hostname": ["iphone", "android", "pixel", "galaxy"]},
    {"type": DeviceType.phone, "is_node": False, "ports_any": [62078]}, # iOS lockdown service
    {"type": DeviceType.tablet, "is_node": False, "hostname": ["ipad", "tablet"]},
    {"type": DeviceType.pc, "is_node": False, "ports_any": [3389, 5900]},
    {"type": DeviceType.pc, "is_node": False, "hostname": ["desktop", "laptop", "pc-", "-pc", "macbook", "workstation"]},
    {"type": DeviceType.pc, "is_node": False, "vendor": ["dell", "hp", "lenovo", "asus"]},

    # Printers & Fallback
    {"type": DeviceType.printer, "is_node": False, "ports_any": [631, 9100]},
    {"type": DeviceType.printer, "is_node": False, "vendor": ["hp", "canon", "epson", "brother", "lexmark"]},
]


def _guess_type(device: ScannedDevice, subnet: str) -> tuple[DeviceType, bool]:
    name = (device.hostname or "").lower()
    vendor = (device.vendor or "").lower()
    ports = set(device.ports)
    host_num = int(ipaddress.ip_address(device.ip)) & 0xFF

    for rule in HEURISTICS:
        match = False
        
        # Condition checks
        if "host_number" in rule and host_num == rule["host_number"]:
            match = True
        elif "hostname" in rule and any(x in name for x in rule["hostname"]):
            match = True
        elif "vendor" in rule and any(x in vendor for x in rule["vendor"]):
            match = True
        elif "ports_all" in rule and set(rule["ports_all"]).issubset(ports):
            match = True
        elif "ports_any" in rule and any(p in ports for p in rule["ports_any"]):
            match = True
            
        if match:
            return rule["type"], rule["is_node"]

    return DeviceType.unknown, False


def scan_subnet(subnet: str, mode: str = "quick") -> list[ScannedDevice]:
    ipaddress.ip_network(subnet, strict=False)
    discovery_xml = _run_nmap(["-sn", subnet, "-oX", "-"], timeout=180)
    devices = _parse_discovery(discovery_xml)
    if not devices:
        return []

    ips = [device.ip for device in devices]
    if mode == "full":
        port_args = ["-Pn", "-p-", "--open", "--max-retries", "1", "--min-rate", "1500"]
        timeout = 900
    else:
        port_args = ["-Pn", "-p", ",".join(str(port) for port in QUICK_PORTS), "--open"]
        timeout = 240
    port_xml = _run_nmap([*port_args, "-oX", "-", *ips], timeout=timeout)
    ports_by_ip = _parse_ports(port_xml)

    for device in devices:
        device.ports = ports_by_ip.get(device.ip, [])
        device.device_type, device.is_network_node = _guess_type(device, subnet)
    return devices

