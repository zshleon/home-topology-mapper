import shutil
import socket
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/api/diagnostics", tags=["diagnostics"])

def check_nmap():
    path = shutil.which("nmap")
    if path:
        return {"status": "ok", "message": f"nmap found at {path}", "hint": None}
    return {
        "status": "error", 
        "message": "nmap not found in system PATH", 
        "hint": "Please install nmap (e.g., 'apt-get update && apt-get install -y nmap' in the container)."
    }

def check_net_raw():
    try:
        # Try to create a raw socket. Requires NET_RAW capability or root.
        s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_ICMP)
        s.close()
        return {"status": "ok", "message": "NET_RAW capability available", "hint": None}
    except PermissionError:
        return {
            "status": "error", 
            "message": "Missing NET_RAW capability", 
            "hint": "In PVE LXC, ensure 'nesting=1' and 'cap_add: NET_RAW' are configured, or run as privileged."
        }
    except Exception as e:
        return {
            "status": "warning", 
            "message": f"Raw socket check failed: {str(e)}", 
            "hint": "This might affect nmap's ability to perform OS detection or fast discovery."
        }

@router.get("")
def get_diagnostics():
    return {
        "checks": [
            {
                "id": "nmap",
                "name": "Nmap Tool",
                **check_nmap()
            },
            {
                "id": "net_raw",
                "name": "Network Permissions (NET_RAW)",
                **check_net_raw()
            }
        ],
        "config_summary": {
            "subnets": settings.scan_subnets,
            "mode": settings.scan_mode
        }
    }
