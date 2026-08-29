#!/data/data/com.termux/files/usr/bin/bash
set -e

REPO_DIR="${HEX_VIEWER_DIR:-$HOME/Hex-Viewer}"

if [ ! -d "$REPO_DIR" ]; then
    echo "Não encontrei o repo em: $REPO_DIR"
    echo "Baixe com: git clone https://github.com/RPGMartins/Hex-Viewer.git ~/Hex-Viewer"
    exit 1
fi

cd "$REPO_DIR"
bash termux/servir_site.sh "$@"
