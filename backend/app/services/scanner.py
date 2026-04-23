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


def _guess_type(device: ScannedDevice, subnet: str) -> tuple[DeviceType, bool]:
    name = (device.hostname or "").lower()
    vendor = (device.vendor or "").lower()
    ports = set(device.ports)
    host_number = int(ipaddress.ip_address(device.ip)) & 0xFF

    if host_number == 1 or {53, 80, 443}.issubset(ports):
        return DeviceType.router, True
    if "tp-link" in vendor or "tplink" in name:
        return DeviceType.switch, True
    if 2049 in ports or 8096 in ports or 9000 in ports:
        return DeviceType.nas, False
    if 3389 in ports or ({139, 445} & ports and 22 not in ports):
        return DeviceType.pc, False
    if 631 in ports:
        return DeviceType.printer, False
    if 62078 in ports or "apple" in vendor:
        return DeviceType.phone, False
    if 8000 in ports and "camera" in name:
        return DeviceType.camera, False
    if 8008 in ports or 8443 in ports:
        return DeviceType.media, False
    if 22 in ports or 8006 in ports:
        return DeviceType.server, False
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

