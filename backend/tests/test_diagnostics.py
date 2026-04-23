import pytest
from app.routers.diagnostics import check_nmap, check_net_raw

def test_check_nmap_structure():
    result = check_nmap()
    assert "status" in result
    assert "message" in result
    assert "id" not in result # id is added in the router wrapper

def test_check_net_raw_structure():
    result = check_net_raw()
    assert "status" in result
    assert result["status"] in ["ok", "error", "warning"]

def test_diagnostics_endpoint_logic():
    # Just verify the router function returns a list of checks
    from app.routers.diagnostics import get_diagnostics
    data = get_diagnostics()
    assert "checks" in data
    assert len(data["checks"]) >= 2
    assert any(c["id"] == "nmap" for c in data["checks"])
    assert any(c["id"] == "net_raw" for c in data["checks"])
