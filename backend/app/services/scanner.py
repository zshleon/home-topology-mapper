from __future__ import annotations

import ipaddress
import shutil
import subprocess
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from app.models import DeviceType, ScanMode


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


class ScanError(RuntimeError):
    def __init__(self, code: str, message: str, hint: str | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.hint = hint


def normalize_scan_mode(mode: str | ScanMode | None) -> ScanMode:
    if isinstance(mode, ScanMode):
        normalized = mode.value
    else:
        normalized = str(mode or ScanMode.quick.value).strip().lower()
    if normalized not in {ScanMode.quick.value, ScanMode.full.value}:
        raise ScanError(
            "invalid_scan_mode",
            f"Unsupported scan mode '{mode}'.",
            "Choose either 'quick' or 'full'.",
        )
    return ScanMode(normalized)


def _build_discovery_args(subnet: str) -> list[str]:
    return ["-n", "-sn", subnet, "-oX", "-"]


def _build_port_scan_args(mode: ScanMode, ips: list[str]) -> tuple[list[str], int]:
    if mode == ScanMode.full:
        return (
            [
                "-n",
                "-Pn",
                "-p-",
                "--open",
                "--max-retries",
                "1",
                "--min-rate",
                "1500",
                *ips,
            ],
            900,
        )

    return (
        [
            "-n",
            "-Pn",
            "-p",
            ",".join(str(port) for port in QUICK_PORTS),
            "--open",
            "--max-retries",
            "1",
            *ips,
        ],
        240,
    )


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
        raise ScanError(
            "nmap_missing",
            "nmap is not installed in this container.",
            "Install nmap inside the LXC or Docker image before scanning.",
        )
    try:
        proc = subprocess.run(
            ["nmap", *args],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise ScanError(
            "scan_timeout",
            f"nmap timed out after {timeout} seconds.",
            "Try quick mode first or narrow the subnet.",
        ) from exc
    stderr = proc.stderr.strip()
    lower = stderr.lower()
    if (
        "requires root privileges" in lower
        or "requires root" in lower
        or "operation not permitted" in lower
        or "raw sockets" in lower
    ):
        raise ScanError(
            "permission_denied",
            "nmap needs raw network privileges in this container.",
            "Run the container with host networking and NET_RAW, then retry the scan.",
        )
    if proc.returncode not in (0, 1):
        raise ScanError(
            "nmap_failed",
            stderr or "nmap failed",
            "Check the subnet, container networking, and nmap permissions.",
        )
    return proc.stdout


def _parse_discovery(xml_text: str) -> list[ScannedDevice]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        raise ScanError(
            "invalid_nmap_output",
            "nmap discovery output could not be parsed.",
            "Check that nmap is producing XML output and the target subnet is reachable.",
        ) from exc
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
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        raise ScanError(
            "invalid_nmap_output",
            "nmap port scan output could not be parsed.",
            "Try quick mode or reduce the subnet size.",
        ) from exc
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


def scan_subnet(subnet: str, mode: str | ScanMode = ScanMode.quick) -> list[ScannedDevice]:
    network = ipaddress.ip_network(subnet, strict=False)
    scan_mode = normalize_scan_mode(mode)
    discovery_xml = _run_nmap(_build_discovery_args(network.with_prefixlen), timeout=180)
    devices = _parse_discovery(discovery_xml)
    if not devices:
        return []

    ips = [device.ip for device in devices]
    port_args, timeout = _build_port_scan_args(scan_mode, ips)
    port_xml = _run_nmap([*port_args, "-oX", "-"], timeout=timeout)
    ports_by_ip = _parse_ports(port_xml)

    for device in devices:
        device.ports = ports_by_ip.get(device.ip, [])
        device.device_type, device.is_network_node = _guess_type(device, subnet)
    return devices
