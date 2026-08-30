#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Cria hexes vazios a partir de Campanhas/<Campanha>/_campaign.md.

Uso:
    python tools/criar_hexes_vazios.py

Ou informando o vault e a campanha:

    python tools/criar_hexes_vazios.py --vault "C:/caminho/Hex-Viewer/obsidian-base" --campaign "Vale dos Sinos"

Ele lê:
- largura
- altura
- coluna_inicial
- linha_inicial

E cria arquivos faltantes em:
Campanhas/<Campanha>/Hexes/

Não sobrescreve hexes existentes.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path


def main() -> int:
    args = parse_args()

    vault = Path(args.vault).expanduser().resolve() if args.vault else guess_vault()
    if not vault:
        raise SystemExit("Não encontrei o vault. Use --vault.")

    campaigns = find_campaigns(vault)

    if not campaigns:
        raise SystemExit(f"Nenhuma campanha encontrada em: {vault / 'Campanhas'}")

    campaign_folder = choose_campaign(campaigns, args.campaign)
    campaign_file = campaign_folder / "_campaign.md"

    frontmatter = parse_frontmatter(campaign_file.read_text(encoding="utf-8"))

    largura = to_int(frontmatter.get("largura"), 0)
    altura = to_int(frontmatter.get("altura"), 0)
    coluna_inicial = str(frontmatter.get("coluna_inicial") or "A")
    linha_inicial = to_int(frontmatter.get("linha_inicial"), 1)

    if largura <= 0 or altura <= 0:
        raise SystemExit("_campaign.md precisa ter largura e altura válidas.")

    hexes_folder = campaign_folder / "Hexes"
    hexes_folder.mkdir(parents=True, exist_ok=True)

    col_start = letters_to_number(coluna_inicial)

    created = 0
    existing = 0

    for c in range(largura):
        col = number_to_letters(col_start + c)

        for l in range(altura):
            row = linha_inicial + l
            hex_id = f"{col}{row}"
            path = hexes_folder / f"{hex_id}.md"

            if path.exists():
                existing += 1
                continue

            path.write_text(build_hex(hex_id), encoding="utf-8", newline="\n")
            created += 1

    print()
    print("Hexes vazios")
    print("============")
    print(f"Vault:     {vault}")
    print(f"Campanha:  {campaign_folder.name}")
    print(f"Tamanho:   {largura} x {altura}")
    print(f"Criados:   {created}")
    print(f"Existiam:  {existing}")
    print(f"Pasta:     {hexes_folder}")
    print()

    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Cria hexes vazios a partir de _campaign.md.")
    parser.add_argument("--vault", default="", help="Pasta raiz do vault/base Obsidian.")
    parser.add_argument("--campaign", default="", help="Nome ou id da campanha.")
    return parser.parse_args()


def guess_vault() -> Path | None:
    current = Path.cwd().resolve()
    candidates = [
        current,
        current / "obsidian-base",
        current.parent / "obsidian-base",
    ]

    for candidate in candidates:
        if (candidate / "Campanhas").exists():
            return candidate

    return None


def find_campaigns(vault: Path) -> list[Path]:
    root = vault / "Campanhas"
    if not root.exists():
        return []

    campaigns = []
    for file in root.glob("*/_campaign.md"):
        campaigns.append(file.parent)

    return sorted(campaigns, key=lambda p: p.name.lower())


def choose_campaign(campaigns: list[Path], wanted: str) -> Path:
    if wanted:
        wanted_norm = normalize(wanted)

        for campaign in campaigns:
            if normalize(campaign.name) == wanted_norm:
                return campaign

            frontmatter = parse_frontmatter((campaign / "_campaign.md").read_text(encoding="utf-8"))
            if normalize(str(frontmatter.get("id") or "")) == wanted_norm:
                return campaign
            if normalize(str(frontmatter.get("nome") or "")) == wanted_norm:
                return campaign

        raise SystemExit(f"Campanha não encontrada: {wanted}")

    if len(campaigns) == 1:
        return campaigns[0]

    print("Campanhas encontradas:")
    for i, campaign in enumerate(campaigns, start=1):
        print(f"{i}. {campaign.name}")

    while True:
        raw = input("Escolha o número da campanha: ").strip()

        if not raw.isdigit():
            continue

        index = int(raw)

        if 1 <= index <= len(campaigns):
            return campaigns[index - 1]


def parse_frontmatter(text: str) -> dict[str, str]:
    match = re.match(r"^---\s*\n([\s\S]*?)\n---", text)
    data: dict[str, str] = {}

    if not match:
        return data

    for raw_line in match.group(1).splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#") or ":" not in line:
            continue

        key, value = line.split(":", 1)
        value = value.strip()

        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
            value = value[1:-1]

        data[key.strip()] = value

    return data


def build_hex(hex_id: str) -> str:
    return """---
fileClass: Hex
hex: {hex_id}
nome: ""

terreno: ""
perigo: ""
exploracao: "[[Desconhecido]]"

feature_estrada: false
feature_rio: false
feature_trilha: false

poi_tipo: ""
poi_nome: ""
poi_estado: ""

faccao_id: ""
faccao_nome: ""
faccao_controle: ""
faccao_relacao: ""
---

# {hex_id}

## Resumo

""".format(hex_id=hex_id)


def to_int(value: object, default: int) -> int:
    try:
        return int(str(value))
    except Exception:
        return default


def letters_to_number(letters: str) -> int:
    value = 0
    for ch in str(letters or "A").upper():
        if "A" <= ch <= "Z":
            value = value * 26 + (ord(ch) - 64)
    return value or 1


def number_to_letters(number: int) -> str:
    n = int(number)
    result = ""
    while n > 0:
        n -= 1
        result = chr(65 + (n % 26)) + result
        n //= 26
    return result or "A"


def normalize(text: str) -> str:
    import unicodedata
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text


if __name__ == "__main__":
    raise SystemExit(main())
