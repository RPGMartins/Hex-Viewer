#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$(dirname "$0")/.."
PORT="${1:-8080}"
echo "Servindo Hex Viewer em http://0.0.0.0:${PORT}"
echo "No celular, veja o IP do Wi-Fi com: ip -4 addr show wlan0"
python3 -m http.server "$PORT" --bind 0.0.0.0
