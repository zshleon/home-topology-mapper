from app.models import DeviceType, ScanMode
from app.services import scanner


DISCOVERY_XML = """<?xml version=\"1.0\"?>
<nmaprun>
  <host>
    <status state=\"up\"/>
    <address addr=\"10.0.0.1\" addrtype=\"ipv4\"/>
    <address addr=\"aa:bb:cc:dd:ee:ff\" addrtype=\"mac\" vendor=\"TP-Link\"/>
    <hostnames>
      <hostname name=\"router.local\"/>
    </hostnames>
  </host>
</nmaprun>
"""


PORT_XML = """<?xml version=\"1.0\"?>
<nmaprun>
  <host>
    <address addr=\"10.0.0.1\" addrtype=\"ipv4\"/>
    <ports>
      <port portid=\"53\"><state state=\"open\"/></port>
      <port portid=\"80\"><state state=\"open\"/></port>
      <port portid=\"443\"><state state=\"open\"/></port>
    </ports>
  </host>
</nmaprun>
"""


def test_normalize_scan_mode_rejects_invalid_value() -> None:
    try:
        scanner.normalize_scan_mode("fast")
    except scanner.ScanError as exc:
        assert exc.code == "invalid_scan_mode"
    else:
        raise AssertionError("Expected ScanError for invalid mode")


def test_scan_subnet_quick_mode_builds_expected_commands(monkeypatch) -> None:
    calls: list[tuple[list[str], int]] = []

    def fake_run_nmap(args: list[str], timeout: int = 180) -> str:
        calls.append((args, timeout))
        if "-sn" in args:
            return DISCOVERY_XML
        return PORT_XML

    monkeypatch.setattr(scanner, "_run_nmap", fake_run_nmap)

    devices = scanner.scan_subnet("10.0.0.0/24", mode=ScanMode.quick)

    assert len(calls) == 2
    assert calls[0][0][:3] == ["-n", "-sn", "10.0.0.0/24"]
    assert calls[1][0][0:4] == ["-n", "-Pn", "-p", ",".join(str(port) for port in scanner.QUICK_PORTS)]
    assert calls[1][1] == 240
    assert len(devices) == 1
    assert devices[0].ip == "10.0.0.1"
    assert devices[0].device_type == DeviceType.router
    assert devices[0].is_network_node is True
    assert devices[0].ports == [53, 80, 443]


def test_scan_subnet_full_mode_uses_full_port_range(monkeypatch) -> None:
    calls: list[tuple[list[str], int]] = []

    def fake_run_nmap(args: list[str], timeout: int = 180) -> str:
        calls.append((args, timeout))
        if "-sn" in args:
            return DISCOVERY_XML
        return PORT_XML

    monkeypatch.setattr(scanner, "_run_nmap", fake_run_nmap)

    scanner.scan_subnet("10.0.0.0/24", mode="full")

    assert len(calls) == 2
    assert "-p-" in calls[1][0]
    assert calls[1][1] == 900
