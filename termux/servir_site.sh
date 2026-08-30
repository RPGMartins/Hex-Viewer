#!/data/data/com.termux/files/usr/bin/bash
set -e

# Hex Viewer - servidor local para Termux
#
# Uso normal:
#   bash termux/servir_site.sh
#
# Padrão:
# - Sempre tenta usar a mesma porta: 8080.
# - Antes de iniciar, encerra servidores antigos de "python -m http.server".
# - Isso evita cair em 8081/8082 e perder localStorage.
#
# Usar outra porta fixa:
#   HEX_PORT=8081 bash termux/servir_site.sh
#
# Não matar servidores antigos:
#   HEX_KILL_OLD=0 bash termux/servir_site.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_DIR"

PORT="${HEX_PORT:-8080}"
KILL_OLD="${HEX_KILL_OLD:-1}"

if [ "$KILL_OLD" != "0" ]; then
  # Fecha servidores antigos que ficaram vivos depois de fechar o Termux.
  # O "|| true" evita erro caso nenhum processo exista.
  pkill -f "python.*http.server" 2>/dev/null || true
  sleep 1
fi

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

IS_FREE="$(python - "$PORT" <<'PY'
import socket
import sys

port = int(sys.argv[1])
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

try:
    sock.bind(("0.0.0.0", port))
    print("yes")
except OSError:
    print("no")
finally:
    sock.close()
PY
)"

if [ "$IS_FREE" != "yes" ]; then
  echo
  echo "ERRO: a porta $PORT ainda está ocupada."
  echo
  echo "Tente matar servidores antigos:"
  echo "pkill -f \"python.*http.server\""
  echo
  echo "Ou rode em outra porta fixa:"
  echo "HEX_PORT=8081 bash termux/servir_site.sh"
  echo
  exit 1
fi

echo
echo "Hex Viewer no Termux"
echo "====================="
echo
echo "Pasta: $REPO_DIR"
echo "Porta fixa: $PORT"
echo "IP da rede: $HOST_IP"
echo
echo "Seu link de mestre no próprio celular:"
echo "http://127.0.0.1:$PORT/?data=data-mestre"
echo
echo "Seu link de mestre pela rede:"
echo "http://$HOST_IP:$PORT/?data=data-mestre"
echo
echo "Link para passar aos jogadores:"
echo "http://$HOST_IP:$PORT/?data=data-jogadores"
echo
echo "Dica:"
echo "Use sempre o link 127.0.0.1 no celular do mestre."
echo "Assim o localStorage não muda quando o IP do Wi-Fi mudar."
echo
echo "Para parar o servidor sem deixar porta presa: CTRL + C"
echo

python -m http.server "$PORT" --bind 0.0.0.0
