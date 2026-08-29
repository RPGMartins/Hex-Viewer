#!/data/data/com.termux/files/usr/bin/bash
set -e

# Hex Viewer - servidor local para Termux
#
# Uso normal:
#   bash termux/servir_site.sh
#
# Usar outra porta:
#   HEX_PORT=8081 bash termux/servir_site.sh
#
# Se a porta estiver ocupada, o script escolhe automaticamente a próxima livre.
# Exemplo: 8080 ocupada -> tenta 8081, 8082...

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_DIR"

START_PORT="${HEX_PORT:-8080}"

HOST_IP="${HEX_HOST_IP:-}"
if [ -z "$HOST_IP" ]; then
  HOST_IP="$(python - <<'PY'
import socket

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Não precisa realmente acessar o Google; só força o sistema a escolher a interface de saída.
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()

print(get_ip())
PY
)"
fi

PORT="$(python - "$START_PORT" <<'PY'
import socket
import sys

start = int(sys.argv[1])

for port in range(start, start + 50):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(("0.0.0.0", port))
        print(port)
        break
    except OSError:
        pass
    finally:
        sock.close()
else:
    raise SystemExit(f"Nenhuma porta livre encontrada entre {start} e {start + 49}")
PY
)"

if [ "$PORT" != "$START_PORT" ]; then
  echo
  echo "Aviso: a porta $START_PORT já estava em uso."
  echo "Vou usar automaticamente a porta $PORT."
fi

echo
echo "Hex Viewer no Termux"
echo "====================="
echo
echo "Pasta: $REPO_DIR"
echo "Porta: $PORT"
echo "IP:    $HOST_IP"
echo
echo "Seu link de mestre:"
echo "http://$HOST_IP:$PORT/?data=data-mestre"
echo
echo "Link para passar aos jogadores:"
echo "http://$HOST_IP:$PORT/?data=data-jogadores"
echo
echo "No próprio celular também funciona:"
echo "http://127.0.0.1:$PORT/?data=data-mestre"
echo
echo "Para escolher outra porta manualmente:"
echo "HEX_PORT=8081 bash termux/servir_site.sh"
echo
echo "Para parar o servidor: CTRL + C"
echo

python -m http.server "$PORT" --bind 0.0.0.0
