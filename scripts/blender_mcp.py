#!/usr/bin/env python3
"""Cliente minimo para el addon BlenderMCP (socket TCP en 127.0.0.1:9876).

Uso:
    python scripts/blender_mcp.py get_scene_info
    python scripts/blender_mcp.py execute_code --code "import bpy; print(len(bpy.data.objects))"
    echo "import bpy; ..." | python scripts/blender_mcp.py execute_code --stdin
"""
import argparse
import json
import socket
import sys

HOST, PORT = "127.0.0.1", 9876


def send(command_type: str, params: dict | None = None, timeout: float = 30.0) -> dict:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(timeout)
        s.connect((HOST, PORT))
        s.sendall(json.dumps({"type": command_type, "params": params or {}}).encode())
        chunks = []
        while True:
            try:
                data = s.recv(65536)
            except socket.timeout:
                break
            if not data:
                break
            chunks.append(data)
            # Respuestas del addon son un unico objeto JSON; intenta parsear.
            try:
                return json.loads(b"".join(chunks).decode())
            except json.JSONDecodeError:
                continue
    return json.loads(b"".join(chunks).decode())


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("command")
    p.add_argument("--code", default=None, help="codigo Python para execute_code")
    p.add_argument("--stdin", action="store_true", help="lee el codigo desde stdin")
    p.add_argument("--params", default=None, help="JSON con params extra")
    args = p.parse_args()

    params = json.loads(args.params) if args.params else {}
    if args.command == "execute_code":
        code = sys.stdin.read() if args.stdin else args.code
        if code is None:
            print("Falta --code o --stdin", file=sys.stderr)
            return 2
        params["code"] = code

    resp = send(args.command, params)
    print(json.dumps(resp, indent=2, ensure_ascii=False))
    return 0 if resp.get("status") == "success" else 1


if __name__ == "__main__":
    raise SystemExit(main())
