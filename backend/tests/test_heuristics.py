import pytest
from app.models import DeviceType
from app.services.scanner import ScannedDevice, _guess_type

@pytest.mark.parametrize("hostname, vendor, ports, ip, expected_type, expected_node", [
    # Host number 1 (Router)
    (None, None, [], "192.168.1.1", DeviceType.router, True),
    # Router by ports
    ("my-box", "Unknown", [53, 80, 443], "192.168.1.10", DeviceType.router, True),
    # Access Point by vendor
    (None, "Ubiquiti Networks", [], "192.168.1.20", DeviceType.access_point, True),
    # NAS by ports
    ("storage", None, [2049], "192.168.1.30", DeviceType.nas, False),
    # Phone by iOS service port
    (None, "Apple", [62078], "192.168.1.40", DeviceType.phone, False),
    # Camera by hostname
    ("ipc-garden", "Dahua", [80], "192.168.1.50", DeviceType.camera, False),
    # IoT by hostname
    ("esp-switch", "Espressif", [], "192.168.1.60", DeviceType.iot, False),
    # Printer by port
    (None, None, [9100], "192.168.1.70", DeviceType.printer, False),
    # Unknown fallback
    ("strange-device", "Ghost Corp", [12345], "192.168.1.80", DeviceType.unknown, False),
])
def test_guess_type_heuristics(hostname, vendor, ports, ip, expected_type, expected_node):
    device = ScannedDevice(ip=ip, hostname=hostname, vendor=vendor, ports=ports)
    dtype, is_node = _guess_type(device, "192.168.1.0/24")
    assert dtype == expected_type
    assert is_node == expected_node

def test_guess_type_priority():
    # A device with 'pve' in hostname but also port 53/80/443
    # Router rule is higher priority than Server rule in HEURISTICS
    device = ScannedDevice(ip="192.168.1.100", hostname="pve-gateway", ports=[53, 80, 443])
    dtype, is_node = _guess_type(device, "192.168.1.0/24")
    assert dtype == DeviceType.router
    assert is_node == True
