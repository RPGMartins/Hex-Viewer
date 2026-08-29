#!/data/data/com.termux/files/usr/bin/bash
set -e

cd "$(dirname "$0")/.."

PORT="${1:-8080}"
DATA_MESTRE="${HEX_DATA_MESTRE:-data-mestre}"
DATA_JOGADORES="${HEX_DATA_JOGADORES:-data-jogadores}"
HOST_IP="${HEX_HOST_IP:-}"

if [ -z "$HOST_IP" ]; then
    HOST_IP="$(python3 - <<'PY'
import socket

s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
    s.connect(("8.8.8.8", 80))
    print(s.getsockname()[0])
except Exception:
    print("")
finally:
    s.close()
PY
)"
fi

if [ -z "$HOST_IP" ]; then
    HOST_IP="127.0.0.1"
fi

BASE_URL="http://${HOST_IP}:${PORT}"

clear
printf "Hex Viewer no Termux\n"
printf "=====================\n\n"
printf "Pasta: %s\n" "$(pwd)"
printf "Porta: %s\n" "$PORT"
printf "IP:    %s\n\n" "$HOST_IP"

printf "Seu link de mestre:\n"
printf "%s/?data=%s\n\n" "$BASE_URL" "$DATA_MESTRE"

printf "Link para passar aos jogadores:\n"
printf "%s/?data=%s\n\n" "$BASE_URL" "$DATA_JOGADORES"

printf "No próprio celular também funciona:\n"
printf "http://127.0.0.1:%s/?data=%s\n\n" "$PORT" "$DATA_MESTRE"

printf "Para fixar apenas o IP impresso pelo script:\n"
printf "HEX_HOST_IP=192.168.0.50 bash termux/servir_site.sh\n\n"
printf "Para IP fixo de verdade, configure reserva DHCP no roteador.\n\n"

python3 -m http.server "$PORT" --bind 0.0.0.0
