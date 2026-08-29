#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Hex Export Tool — Perfil + Exportação em uma janela

Uso:
    python hex_export_tool.py

Fluxo:
1. Escolha o vault do Obsidian.
2. Escolha/crie um perfil de exportação.
3. Marque campanhas e campos públicos.
4. Salve o perfil.
5. Exporte para a pasta data/ do Hex Viewer.

Arquivos gerados:
- No vault:
    Exportacoes/<perfil>.json
    Campanhas/<Campanha>/Exportacoes/<perfil>.json

- No destino do site:
    data/campaigns.json
    data/<campanha-id>/hexes-public.json
    data/<campanha-id>/hex-config.json
"""

from __future__ import annotations

import json
import os
import platform
import re
import shutil
import subprocess
import sys
import tkinter as tk
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from tkinter import filedialog, messagebox, simpledialog, ttk
from typing import Any


APP_VERSION = 2
PROFILE_VERSION = 1

COLORS = {
    "bg": "#202225",
    "panel": "#2b2d31",
    "panel2": "#313338",
    "line": "#45484f",
    "text": "#eeeeee",
    "muted": "#b8bbc2",
    "accent": "#c061cb",
    "accent2": "#7d4f8d",
    "danger": "#e06c75",
    "success": "#8bc34a",
    "entry": "#1e1f22",
}

CAMPAIGN_FIELD_KEYS = [
    ("nome", "Nome"),
    ("descricao", "Descrição"),
    ("sistema", "Sistema"),
    ("escala_hex", "Escala"),
    ("hex_inicial", "Hex inicial"),
    ("rumor_principal", "Rumor principal"),
]

HEX_FIELD_KEYS = [
    ("include_hex", "Incluir"),
    ("nome", "Nome"),
    ("terreno", "Terreno"),
    ("perigo", "Perigo"),
    ("exploracao", "Exploração"),
    ("features", "Features"),
    ("ponto_interesse", "POI"),
    ("faccao", "Facção"),
    ("resumo", "Resumo"),
]

DEFAULT_CAMPAIGN_FIELDS = {
    "nome": True,
    "descricao": True,
    "sistema": True,
    "escala_hex": True,
    "hex_inicial": True,
    "rumor_principal": True,
}

DEFAULT_HEX_FIELDS = {
    "include_hex": False,
    "nome": False,
    "terreno": False,
    "perigo": False,
    "exploracao": True,
    "features": False,
    "ponto_interesse": False,
    "faccao": False,
    "resumo": False,
}

CATALOG_DEFS = {
    "terrenos": {
        "folder": "Catalogos/Terrenos",
        "config_key": "terrenos",
        "always_include": [],
    },
    "perigos": {
        "folder": "Catalogos/Perigos",
        "config_key": "perigos",
        "always_include": [],
    },
    "exploracoes": {
        "folder": "Catalogos/Exploracoes",
        "config_key": "exploracoes",
        "always_include": ["desconhecido"],
    },
    "pontos_interesse": {
        "folder": "Catalogos/Pontos de Interesse",
        "config_key": "pontos_interesse",
        "always_include": [],
    },
    "conexoes": {
        "folder": "Catalogos/Conexoes",
        "config_key": "conexoes",
        "always_include": [],
    },
    "estados_ponto_interesse": {
        "folder": "Catalogos/Estados de POI",
        "config_key": "estados_ponto_interesse",
        "always_include": [],
    },
    "controles_faccao": {
        "folder": "Catalogos/Controles de Faccao",
        "config_key": "controles_faccao",
        "always_include": [],
    },
    "relacoes_faccao": {
        "folder": "Catalogos/Relacoes de Faccao",
        "config_key": "relacoes_faccao",
        "always_include": [],
    },
}

FALLBACK_CONFIG = {
    "cor_terreno": "#B8B8B8",
    "cor_terreno_oculto": "#767676",
    "cor_borda": "#555555",
    "cor_borda_hex": "#222222",
    "icone_ponto_interesse": "./images/default.svg",
}


@dataclass
class HexInfo:
    hex_id: str
    file_path: Path
    frontmatter: dict[str, Any]
    sections: dict[str, str]

    @property
    def nome(self) -> str:
        return str(self.frontmatter.get("nome") or "")

    def display_value(self, key: str) -> str:
        fm = self.frontmatter

        if key == "include_hex":
            return ""

        if key == "nome":
            return str(fm.get("nome") or "")

        if key == "terreno":
            return clean_link(fm.get("terreno") or "")

        if key == "perigo":
            return clean_link(fm.get("perigo") or "")

        if key == "exploracao":
            return clean_link(fm.get("exploracao") or "")

        if key == "features":
            features = []
            for field, value in fm.items():
                if field.startswith("feature_") and value is True:
                    features.append(field.replace("feature_", ""))
            return ", ".join(features)

        if key == "ponto_interesse":
            parts = []
            if fm.get("poi_tipo"):
                parts.append(clean_link(fm.get("poi_tipo")))
            if fm.get("poi_nome"):
                parts.append(str(fm.get("poi_nome")))
            if fm.get("poi_estado"):
                parts.append(clean_link(fm.get("poi_estado")))
            return " / ".join(parts)

        if key == "faccao":
            parts = []
            if fm.get("faccao_nome"):
                parts.append(str(fm.get("faccao_nome")))
            if fm.get("faccao_controle"):
                parts.append(clean_link(fm.get("faccao_controle")))
            if fm.get("faccao_relacao"):
                parts.append(clean_link(fm.get("faccao_relacao")))
            return " / ".join(parts)

        if key == "resumo":
            return one_line(self.sections.get("Resumo", ""), 70)

        return ""


@dataclass
class CampaignInfo:
    folder: Path
    campaign_file: Path
    frontmatter: dict[str, Any]
    sections: dict[str, str]
    hexes: list[HexInfo] = field(default_factory=list)

    @property
    def id(self) -> str:
        return str(self.frontmatter.get("id") or slugify(self.folder.name))

    @property
    def nome(self) -> str:
        return str(self.frontmatter.get("nome") or self.folder.name)

    @property
    def descricao(self) -> str:
        return str(self.frontmatter.get("descricao") or "")


@dataclass
class CatalogItem:
    source_key: str
    folder: Path
    file_path: Path
    note_name: str
    id: str
    label: str
    data: dict[str, Any]


class AppLogger:
    def __init__(self) -> None:
        self.lines: list[str] = []
        self.warnings: list[str] = []

    def info(self, text: str = "") -> None:
        self.lines.append(text)

    def warning(self, text: str) -> None:
        message = f"AVISO: {text}"
        self.warnings.append(message)
        self.lines.append(message)

    def text(self) -> str:
        return "\n".join(self.lines)


class DarkScrollFrame(tk.Frame):
    def __init__(self, parent: tk.Widget, bg: str | None = None):
        bg = bg or COLORS["bg"]
        super().__init__(parent, bg=bg)

        self.canvas = tk.Canvas(
            self,
            bg=bg,
            highlightthickness=0,
            bd=0,
            relief="flat",
        )
        self.scrollbar_y = ttk.Scrollbar(self, orient="vertical", command=self.canvas.yview)
        self.scrollbar_x = ttk.Scrollbar(self, orient="horizontal", command=self.canvas.xview)

        self.content = tk.Frame(self.canvas, bg=bg)
        self.window_id = self.canvas.create_window((0, 0), window=self.content, anchor="nw")

        self.canvas.configure(
            yscrollcommand=self.scrollbar_y.set,
            xscrollcommand=self.scrollbar_x.set,
        )

        self.canvas.grid(row=0, column=0, sticky="nsew")
        self.scrollbar_y.grid(row=0, column=1, sticky="ns")
        self.scrollbar_x.grid(row=1, column=0, sticky="ew")

        self.rowconfigure(0, weight=1)
        self.columnconfigure(0, weight=1)

        self.content.bind("<Configure>", self._on_content_configure)
        self.canvas.bind("<Configure>", self._on_canvas_configure)
        self.canvas.bind_all("<MouseWheel>", self._on_mousewheel)

    def _on_content_configure(self, _event: tk.Event) -> None:
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def _on_canvas_configure(self, event: tk.Event) -> None:
        # Mantém o conteúdo com pelo menos a largura visível, evitando faixa branca/vazia.
        content_width = max(self.content.winfo_reqwidth(), event.width)
        self.canvas.itemconfigure(self.window_id, width=content_width)

    def _on_mousewheel(self, event: tk.Event) -> None:
        widget = self.winfo_containing(event.x_root, event.y_root)
        if widget is None or not self.is_ancestor_of(widget):
            return

        self.canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

    def is_ancestor_of(self, widget: tk.Widget) -> bool:
        current = widget
        while current is not None:
            if current == self:
                return True
            current = current.master
        return False


class CampaignTab:
    def __init__(
        self,
        app: "HexExportTool",
        notebook: ttk.Notebook,
        campaign: CampaignInfo,
        existing_profile: dict[str, Any] | None,
    ):
        self.app = app
        self.campaign = campaign
        self.existing_profile = existing_profile or {}

        self.frame = ttk.Frame(notebook, style="Panel.TFrame")
        notebook.add(self.frame, text=campaign.nome)

        self.campaign_vars: dict[str, tk.BooleanVar] = {}
        self.default_vars: dict[str, tk.BooleanVar] = {}
        self.hex_vars: dict[str, dict[str, tk.BooleanVar]] = {}

        self._build()

    def _build(self) -> None:
        self.frame.rowconfigure(3, weight=1)
        self.frame.columnconfigure(0, weight=1)

        title_bar = ttk.Frame(self.frame, style="Panel.TFrame")
        title_bar.grid(row=0, column=0, sticky="ew", padx=12, pady=(12, 4))
        title_bar.columnconfigure(0, weight=1)

        ttk.Label(
            title_bar,
            text=f"{self.campaign.nome}",
            style="Title.TLabel",
        ).grid(row=0, column=0, sticky="w")

        ttk.Label(
            title_bar,
            text=f"{self.campaign.id} · {len(self.campaign.hexes)} hexes",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(2, 0))

        if self.campaign.descricao:
            ttk.Label(
                self.frame,
                text=self.campaign.descricao,
                style="Muted.TLabel",
                wraplength=900,
            ).grid(row=1, column=0, sticky="ew", padx=12, pady=(0, 10))

        top = ttk.Frame(self.frame, style="Panel.TFrame")
        top.grid(row=2, column=0, sticky="ew", padx=12, pady=(0, 10))
        top.columnconfigure(0, weight=1)
        top.columnconfigure(1, weight=1)

        campaign_box = ttk.LabelFrame(top, text="Dados da campanha")
        campaign_box.grid(row=0, column=0, sticky="nsew", padx=(0, 6))

        existing_campaign_fields = self.existing_profile.get("campaign_fields", {})
        for index, (key, label) in enumerate(CAMPAIGN_FIELD_KEYS):
            initial = bool(existing_campaign_fields.get(key, DEFAULT_CAMPAIGN_FIELDS.get(key, False)))
            var = tk.BooleanVar(value=initial)
            self.campaign_vars[key] = var
            ttk.Checkbutton(campaign_box, text=label, variable=var).grid(
                row=index // 3,
                column=index % 3,
                sticky="w",
                padx=8,
                pady=4,
            )

        defaults_box = ttk.LabelFrame(top, text="Padrão para hexes novos")
        defaults_box.grid(row=0, column=1, sticky="nsew", padx=(6, 0))

        existing_defaults = self.existing_profile.get("defaults", {})
        for index, (key, label) in enumerate(HEX_FIELD_KEYS):
            initial = bool(existing_defaults.get(key, DEFAULT_HEX_FIELDS.get(key, False)))
            var = tk.BooleanVar(value=initial)
            self.default_vars[key] = var
            ttk.Checkbutton(defaults_box, text=label, variable=var).grid(
                row=index // 5,
                column=index % 5,
                sticky="w",
                padx=8,
                pady=4,
            )

        scroll = DarkScrollFrame(self.frame, bg=COLORS["panel"])
        scroll.grid(row=3, column=0, sticky="nsew", padx=12, pady=(0, 10))

        self._build_hex_table(scroll.content)

        actions = ttk.Frame(self.frame, style="Panel.TFrame")
        actions.grid(row=4, column=0, sticky="ew", padx=12, pady=(0, 12))

        ttk.Button(actions, text="Aplicar padrões", command=self.apply_defaults_to_all).pack(side="left", padx=(0, 8))
        ttk.Button(actions, text="Incluir todos", command=self.include_all).pack(side="left", padx=(0, 8))
        ttk.Button(actions, text="Limpar todos", command=self.clear_all).pack(side="left", padx=(0, 8))

    def _build_hex_table(self, parent: tk.Frame) -> None:
        headers = ["Hex", "Nome", "Prévia"]
        headers.extend(label for _, label in HEX_FIELD_KEYS)

        for col, header in enumerate(headers):
            label = tk.Label(
                parent,
                text=header,
                bg=COLORS["panel2"],
                fg=COLORS["text"],
                font=("Segoe UI", 9, "bold"),
                padx=7,
                pady=6,
                anchor="w",
            )
            label.grid(row=0, column=col, sticky="ew", padx=1, pady=(0, 2))

        existing_hexes = self.existing_profile.get("hexes", {})

        for row_index, hex_info in enumerate(self.campaign.hexes, start=1):
            row_bg = COLORS["panel"] if row_index % 2 else COLORS["panel2"]

            tk.Label(
                parent,
                text=hex_info.hex_id,
                bg=row_bg,
                fg=COLORS["text"],
                padx=7,
                pady=4,
                anchor="w",
            ).grid(row=row_index, column=0, sticky="ew", padx=1, pady=1)

            tk.Label(
                parent,
                text=hex_info.nome,
                bg=row_bg,
                fg=COLORS["text"],
                padx=7,
                pady=4,
                anchor="w",
            ).grid(row=row_index, column=1, sticky="ew", padx=1, pady=1)

            tk.Label(
                parent,
                text=self._build_preview(hex_info),
                bg=row_bg,
                fg=COLORS["muted"],
                padx=7,
                pady=4,
                anchor="w",
            ).grid(row=row_index, column=2, sticky="ew", padx=1, pady=1)

            per_hex_vars: dict[str, tk.BooleanVar] = {}
            saved_hex = existing_hexes.get(hex_info.hex_id, {})

            for col_offset, (key, _label) in enumerate(HEX_FIELD_KEYS, start=3):
                initial = bool(saved_hex.get(key, self.default_vars[key].get()))
                var = tk.BooleanVar(value=initial)
                per_hex_vars[key] = var

                cell = tk.Frame(parent, bg=row_bg)
                cell.grid(row=row_index, column=col_offset, sticky="ew", padx=1, pady=1)

                cb = ttk.Checkbutton(cell, variable=var)
                cb.pack(anchor="center", padx=6, pady=1)

            self.hex_vars[hex_info.hex_id] = per_hex_vars

        parent.columnconfigure(2, weight=1)

    def _build_preview(self, hex_info: HexInfo) -> str:
        parts = []
        labels = {
            "terreno": "T",
            "perigo": "P",
            "exploracao": "E",
            "features": "F",
            "ponto_interesse": "POI",
            "faccao": "Fac",
        }

        for key in ["terreno", "perigo", "exploracao", "features", "ponto_interesse", "faccao"]:
            value = hex_info.display_value(key)
            if value:
                parts.append(f"{labels[key]}: {value}")

        return one_line(" | ".join(parts), 120)

    def apply_defaults_to_all(self) -> None:
        for per_hex in self.hex_vars.values():
            for key, var in per_hex.items():
                var.set(self.default_vars[key].get())

    def include_all(self) -> None:
        for per_hex in self.hex_vars.values():
            per_hex["include_hex"].set(True)

    def clear_all(self) -> None:
        for per_hex in self.hex_vars.values():
            for var in per_hex.values():
                var.set(False)

    def to_profile(self, profile_id: str, profile_name: str) -> dict[str, Any]:
        return {
            "schema_version": PROFILE_VERSION,
            "profile_id": profile_id,
            "profile_name": profile_name,
            "updated_at": datetime.now().isoformat(timespec="seconds"),
            "campaign_id": self.campaign.id,
            "campaign_name": self.campaign.nome,
            "campaign_folder": to_posix_rel(self.app.vault_path, self.campaign.folder),
            "export_enabled": True,
            "campaign_fields": {
                key: var.get()
                for key, var in self.campaign_vars.items()
            },
            "defaults": {
                key: var.get()
                for key, var in self.default_vars.items()
            },
            "hexes": {
                hex_id: {
                    key: var.get()
                    for key, var in per_hex.items()
                }
                for hex_id, per_hex in self.hex_vars.items()
            },
        }


class CatalogIndex:
    def __init__(self, vault_path: Path, logger: AppLogger):
        self.vault_path = vault_path
        self.logger = logger
        self.by_source_and_id: dict[str, dict[str, CatalogItem]] = {}
        self.by_source_and_note: dict[str, dict[str, CatalogItem]] = {}

        self.load()

    def load(self) -> None:
        for source_key, definition in CATALOG_DEFS.items():
            folder = self.vault_path / definition["folder"]
            self.by_source_and_id[source_key] = {}
            self.by_source_and_note[source_key] = {}

            if not folder.exists():
                self.logger.warning(f"Pasta de catálogo não encontrada: {folder}")
                continue

            for file_path in sorted(folder.glob("*.md"), key=lambda item: item.stem.lower()):
                parsed = parse_markdown_file(file_path)
                frontmatter = parsed["frontmatter"]

                item_id = str(frontmatter.get("id") or slugify(file_path.stem, separator="_"))
                label = str(frontmatter.get("label") or file_path.stem)

                item = CatalogItem(
                    source_key=source_key,
                    folder=folder,
                    file_path=file_path,
                    note_name=file_path.stem,
                    id=item_id,
                    label=label,
                    data=frontmatter,
                )

                self.by_source_and_id[source_key][item_id] = item
                self.by_source_and_note[source_key][normalize_link_key(file_path.stem)] = item
                self.by_source_and_note[source_key][normalize_link_key(item_id)] = item
                self.by_source_and_note[source_key][normalize_link_key(label)] = item

    def resolve(self, source_key: str, raw_value: Any) -> CatalogItem | None:
        if raw_value is None or raw_value == "":
            return None

        link_name = extract_wikilink_name(raw_value)
        key = normalize_link_key(link_name)

        item = self.by_source_and_note.get(source_key, {}).get(key)

        if item is None:
            item = self.by_source_and_id.get(source_key, {}).get(str(raw_value))

        if item is None:
            self.logger.warning(
                f"Não encontrei '{raw_value}' no catálogo {source_key}. "
                f"O valor será ignorado na exportação pública."
            )

        return item

    def item_by_id(self, source_key: str, item_id: str) -> CatalogItem | None:
        return self.by_source_and_id.get(source_key, {}).get(item_id)


class ExportRunner:
    def __init__(self, vault_path: Path, output_path: Path, profile_id: str, site_data_base: str = "./data"):
        self.vault_path = vault_path
        self.output_path = output_path
        self.profile_id = slugify(profile_id)
        self.site_data_base = site_data_base.rstrip("/")
        self.logger = AppLogger()
        self.catalogs = CatalogIndex(vault_path, self.logger)

    def export(self) -> str:
        root_profile_path = self.vault_path / "Exportacoes" / f"{self.profile_id}.json"

        if not root_profile_path.exists():
            raise FileNotFoundError(
                f"Perfil principal não encontrado: {root_profile_path}\n"
                f"Crie ou salve o perfil primeiro."
            )

        root_profile = read_json(root_profile_path)
        selected_campaign_ids = set(root_profile.get("selected_campaign_ids", []))

        if not selected_campaign_ids:
            raise ValueError("O perfil não tem campanhas selecionadas para exportar.")

        self.logger.info(f"Vault: {self.vault_path}")
        self.logger.info(f"Perfil: {self.profile_id}")
        self.logger.info(f"Saída: {self.output_path}")
        self.logger.info("")

        self.validate_before_export(root_profile, selected_campaign_ids)
        backup_json_files(self.output_path, self.logger)
        self.logger.info("")

        manifest_campaigns: list[dict[str, Any]] = []

        for campaign_entry in root_profile.get("campaigns", []):
            campaign_id = campaign_entry.get("campaign_id")

            if campaign_id not in selected_campaign_ids:
                continue

            campaign_folder = self.vault_path / str(campaign_entry.get("campaign_folder", ""))
            profile_path = self.vault_path / str(campaign_entry.get("profile_path", ""))

            if not campaign_folder.exists():
                self.logger.warning(f"Pasta da campanha não encontrada: {campaign_folder}")
                continue

            if not profile_path.exists():
                self.logger.warning(f"Perfil da campanha não encontrado: {profile_path}")
                continue

            campaign_profile = read_json(profile_path)
            campaign = load_campaign(campaign_folder)

            exported = self.export_campaign(campaign, campaign_profile)

            manifest_campaigns.append({
                "id": campaign.id,
                "nome": exported["manifest_nome"],
                "descricao": exported["manifest_descricao"],
                "tipo": campaign_profile.get("profile_id", self.profile_id),
                "hexes": f"{self.site_data_base}/{campaign.id}/hexes-public.json",
                "config": f"{self.site_data_base}/{campaign.id}/hex-config.json",
            })

        if not manifest_campaigns:
            raise ValueError("Nenhuma campanha foi exportada. Confira o perfil e as campanhas marcadas.")

        manifest_campaigns.sort(key=lambda item: str(item.get("nome") or item.get("id")).lower())

        self.output_path.mkdir(parents=True, exist_ok=True)

        write_json(self.output_path / "campaigns.json", {
            "versao": 1,
            "campanhas": manifest_campaigns,
        })

        self.logger.info("")
        self.logger.info(f"Manifesto criado: {self.output_path / 'campaigns.json'}")
        self.logger.info("Exportação concluída.")

        return self.logger.text()

    def validate_before_export(self, root_profile: dict[str, Any], selected_campaign_ids: set[str]) -> None:
        self.logger.info("Validando perfil antes da exportação...")

        errors: list[str] = []
        warnings: list[str] = []
        campaign_entries = root_profile.get("campaigns", [])
        selected_entries = [entry for entry in campaign_entries if entry.get("campaign_id") in selected_campaign_ids]

        if not selected_entries:
            errors.append("O perfil marca campanhas para exportar, mas nenhuma entrada correspondente foi encontrada no perfil principal.")

        for campaign_entry in selected_entries:
            campaign_folder = self.vault_path / str(campaign_entry.get("campaign_folder", ""))
            profile_path = self.vault_path / str(campaign_entry.get("profile_path", ""))
            campaign_id = str(campaign_entry.get("campaign_id") or "campanha-sem-id")

            if not campaign_folder.exists():
                errors.append(f"{campaign_id}: pasta da campanha não encontrada: {campaign_folder}")
                continue

            if not profile_path.exists():
                errors.append(f"{campaign_id}: perfil da campanha não encontrado: {profile_path}")
                continue

            try:
                campaign_profile = read_json(profile_path)
                campaign = load_campaign(campaign_folder)
            except Exception as exc:
                errors.append(f"{campaign_id}: erro ao ler campanha/perfil: {exc}")
                continue

            self.validate_campaign(campaign, campaign_profile, errors, warnings)

        for warning in warnings:
            self.logger.warning(warning)

        if errors:
            self.logger.info("")
            self.logger.info("Erros encontrados:")
            for error in errors:
                self.logger.info(f"- {error}")

            raise ValueError(
                "Foram encontrados erros graves antes da exportação.\n\n"
                + "\n".join(f"- {error}" for error in errors[:20])
                + ("\n..." if len(errors) > 20 else "")
            )

        self.logger.info("Validação concluída sem erros graves.")

    def validate_campaign(
        self,
        campaign: CampaignInfo,
        campaign_profile: dict[str, Any],
        errors: list[str],
        warnings: list[str],
    ) -> None:
        fm = campaign.frontmatter
        prefix = f"{campaign.nome} ({campaign.id})"

        for required_field in ["largura", "altura"]:
            value = fm.get(required_field)
            if not isinstance(value, int) or value <= 0:
                errors.append(f"{prefix}: campo obrigatório inválido em _campaign.md: {required_field}={value!r}")

        for recommended_field in ["coluna_inicial", "linha_inicial", "largura_hex", "altura_hex"]:
            if fm.get(recommended_field) in (None, ""):
                warnings.append(f"{prefix}: campo recomendado ausente em _campaign.md: {recommended_field}")

        seen_hexes: set[str] = set()
        duplicates: set[str] = set()
        hex_by_id: dict[str, HexInfo] = {}

        for hex_data in campaign.hexes:
            if not hex_data.hex_id:
                errors.append(f"{prefix}: existe um arquivo de hex sem ID: {hex_data.file_path}")
                continue

            if hex_data.hex_id in seen_hexes:
                duplicates.add(hex_data.hex_id)
            seen_hexes.add(hex_data.hex_id)
            hex_by_id[hex_data.hex_id] = hex_data

        for hex_id in sorted(duplicates, key=parse_hex_sort_key):
            errors.append(f"{prefix}: hex duplicado: {hex_id}")

        profile_hexes = campaign_profile.get("hexes", {})
        included_count = 0

        for hex_id, hex_profile in profile_hexes.items():
            if not hex_profile.get("include_hex"):
                continue

            if hex_id not in hex_by_id:
                errors.append(f"{prefix}: perfil tenta exportar {hex_id}, mas o arquivo do hex não existe mais.")
                continue

            included_count += 1
            self.validate_hex(hex_by_id[hex_id], hex_profile, errors, warnings)

        if included_count == 0:
            warnings.append(f"{prefix}: nenhuma casa/hex está marcada como pública neste perfil.")

    def validate_hex(
        self,
        hex_data: HexInfo,
        hex_profile: dict[str, Any],
        errors: list[str],
        warnings: list[str],
    ) -> None:
        fm = hex_data.frontmatter
        prefix = f"{hex_data.hex_id} ({hex_data.file_path.name})"

        for field_key, source_key, label in [
            ("terreno", "terrenos", "Terreno"),
            ("perigo", "perigos", "Perigo"),
            ("exploracao", "exploracoes", "Exploração"),
        ]:
            if not hex_profile.get(field_key):
                continue

            value = fm.get(field_key)
            if value in (None, ""):
                warnings.append(f"{prefix}: {label} está marcado para exportar, mas está vazio.")
                continue

            if self.catalogs.resolve(source_key, value) is None:
                errors.append(f"{prefix}: link quebrado em {field_key}: {value}")

        if hex_profile.get("features"):
            exported_features = 0
            for key, value in fm.items():
                if not key.startswith("feature_") or value is not True:
                    continue
                exported_features += 1
                feature_id = key.replace("feature_", "", 1)
                if self.catalogs.item_by_id("conexoes", feature_id) is None:
                    errors.append(f"{prefix}: feature_{feature_id}=true, mas não existe em Catalogos/Conexoes.")
            if exported_features == 0:
                warnings.append(f"{prefix}: Features está marcado para exportar, mas nenhuma feature está true.")

        if hex_profile.get("ponto_interesse"):
            has_poi_data = bool(
                fm.get("poi_tipo")
                or fm.get("poi_nome")
                or fm.get("poi_estado")
                or hex_data.sections.get("Ponto de interesse - descrição")
            )
            if not has_poi_data:
                warnings.append(f"{prefix}: POI está marcado para exportar, mas não há dados de POI.")

            if fm.get("poi_tipo") and self.catalogs.resolve("pontos_interesse", fm.get("poi_tipo")) is None:
                errors.append(f"{prefix}: link quebrado em poi_tipo: {fm.get('poi_tipo')}")

            if fm.get("poi_estado") and self.catalogs.resolve("estados_ponto_interesse", fm.get("poi_estado")) is None:
                errors.append(f"{prefix}: link quebrado em poi_estado: {fm.get('poi_estado')}")

        if hex_profile.get("faccao"):
            has_faction_data = bool(
                fm.get("faccao_id")
                or fm.get("faccao_nome")
                or fm.get("faccao_controle")
                or fm.get("faccao_relacao")
            )
            if not has_faction_data:
                warnings.append(f"{prefix}: Facção está marcado para exportar, mas não há dados de facção.")

            if fm.get("faccao_controle") and self.catalogs.resolve("controles_faccao", fm.get("faccao_controle")) is None:
                errors.append(f"{prefix}: link quebrado em faccao_controle: {fm.get('faccao_controle')}")

            if fm.get("faccao_relacao") and self.catalogs.resolve("relacoes_faccao", fm.get("faccao_relacao")) is None:
                errors.append(f"{prefix}: link quebrado em faccao_relacao: {fm.get('faccao_relacao')}")

        if hex_profile.get("nome") and not fm.get("nome"):
            warnings.append(f"{prefix}: Nome está marcado para exportar, mas está vazio.")

        if hex_profile.get("resumo") and not hex_data.sections.get("Resumo"):
            warnings.append(f"{prefix}: Resumo está marcado para exportar, mas a seção ## Resumo está vazia ou ausente.")

    def export_campaign(self, campaign: CampaignInfo, campaign_profile: dict[str, Any]) -> dict[str, Any]:
        self.logger.info(f"Exportando campanha: {campaign.nome} ({campaign.id})")

        profile_hexes = campaign_profile.get("hexes", {})
        campaign_fields = campaign_profile.get("campaign_fields", {})

        used: dict[str, set[str]] = {
            "terrenos": set(),
            "perigos": set(),
            "exploracoes": set(),
            "pontos_interesse": set(),
            "conexoes": set(),
            "estados_ponto_interesse": set(),
            "controles_faccao": set(),
            "relacoes_faccao": set(),
        }

        public_hexes: list[dict[str, Any]] = []

        for hex_data in campaign.hexes:
            hex_profile = profile_hexes.get(hex_data.hex_id)

            if not hex_profile:
                continue

            if not bool(hex_profile.get("include_hex", False)):
                continue

            public_hex = self.build_public_hex(hex_data, hex_profile, used)

            if public_hex is not None:
                public_hexes.append(public_hex)

        public_hexes.sort(key=lambda item: parse_hex_sort_key(str(item.get("hex", ""))))

        map_data = self.build_map_data(campaign, campaign_fields)

        campaign_output_folder = self.output_path / campaign.id
        campaign_output_folder.mkdir(parents=True, exist_ok=True)

        write_json(campaign_output_folder / "hexes-public.json", {
            "mapa": map_data,
            "hexes": public_hexes,
        })

        config = self.build_filtered_config(used)
        write_json(campaign_output_folder / "hex-config.json", config)

        self.logger.info(f"  Hexes públicos: {len(public_hexes)}")
        self.logger.info(f"  Criado: {campaign_output_folder / 'hexes-public.json'}")
        self.logger.info(f"  Criado: {campaign_output_folder / 'hex-config.json'}")

        return {
            "manifest_nome": str(map_data.get("nome") or campaign.nome or campaign.id),
            "manifest_descricao": str(map_data.get("descricao") or campaign.frontmatter.get("descricao") or ""),
        }

    def build_public_hex(
        self,
        hex_data: HexInfo,
        hex_profile: dict[str, Any],
        used: dict[str, set[str]],
    ) -> dict[str, Any] | None:
        fm = hex_data.frontmatter

        public: dict[str, Any] = {
            "hex": hex_data.hex_id,
        }

        if hex_profile.get("nome") and fm.get("nome"):
            public["nome"] = fm.get("nome")

        if hex_profile.get("resumo"):
            resumo = hex_data.sections.get("Resumo", "")
            if resumo:
                public["resumo"] = resumo

        if hex_profile.get("terreno"):
            item = self.catalogs.resolve("terrenos", fm.get("terreno"))
            if item is not None:
                public["terreno"] = item.id
                used["terrenos"].add(item.id)

        if hex_profile.get("perigo"):
            item = self.catalogs.resolve("perigos", fm.get("perigo"))
            if item is not None:
                public["perigo"] = item.id
                used["perigos"].add(item.id)

        if hex_profile.get("exploracao"):
            item = self.catalogs.resolve("exploracoes", fm.get("exploracao"))
            if item is not None:
                public["exploracao"] = item.id
                used["exploracoes"].add(item.id)

        if hex_profile.get("features"):
            features: dict[str, bool] = {}

            for key, value in fm.items():
                if not key.startswith("feature_"):
                    continue

                if value is not True:
                    continue

                feature_id = key.replace("feature_", "", 1)
                features[feature_id] = True
                used["conexoes"].add(feature_id)

                if self.catalogs.item_by_id("conexoes", feature_id) is None:
                    self.logger.warning(
                        f"{hex_data.file_path}: feature_{feature_id} está true, "
                        f"mas não existe em Catalogos/Conexoes."
                    )

            if features:
                public["features"] = features

        if hex_profile.get("ponto_interesse"):
            poi = self.build_public_poi(hex_data, used)
            if poi:
                public["ponto_interesse"] = poi

        if hex_profile.get("faccao"):
            faccao = self.build_public_faccao(hex_data, used)
            if faccao:
                public["faccao"] = faccao

        return clean_object(public)

    def build_public_poi(self, hex_data: HexInfo, used: dict[str, set[str]]) -> dict[str, Any]:
        fm = hex_data.frontmatter
        poi: dict[str, Any] = {}

        item = self.catalogs.resolve("pontos_interesse", fm.get("poi_tipo"))
        if item is not None:
            poi["tipo"] = item.id
            used["pontos_interesse"].add(item.id)

        if fm.get("poi_nome"):
            poi["nome"] = fm.get("poi_nome")

        estado = self.catalogs.resolve("estados_ponto_interesse", fm.get("poi_estado"))
        if estado is not None:
            poi["estado"] = estado.id
            used["estados_ponto_interesse"].add(estado.id)

        descricao = hex_data.sections.get("Ponto de interesse - descrição", "")
        if descricao:
            poi["descricao"] = descricao

        return clean_object(poi)

    def build_public_faccao(self, hex_data: HexInfo, used: dict[str, set[str]]) -> dict[str, Any]:
        fm = hex_data.frontmatter
        faccao: dict[str, Any] = {}

        if fm.get("faccao_id"):
            faccao["id"] = fm.get("faccao_id")

        if fm.get("faccao_nome"):
            faccao["nome"] = fm.get("faccao_nome")

        controle = self.catalogs.resolve("controles_faccao", fm.get("faccao_controle"))
        if controle is not None:
            faccao["controle"] = controle.id
            used["controles_faccao"].add(controle.id)

        relacao = self.catalogs.resolve("relacoes_faccao", fm.get("faccao_relacao"))
        if relacao is not None:
            faccao["relacao"] = relacao.id
            used["relacoes_faccao"].add(relacao.id)

        return clean_object(faccao)

    def build_map_data(self, campaign: CampaignInfo, campaign_fields: dict[str, Any]) -> dict[str, Any]:
        fm = campaign.frontmatter

        data: dict[str, Any] = clean_object({
            "id": campaign.id,
            "versao": fm.get("versao"),
            "largura": fm.get("largura"),
            "altura": fm.get("altura"),
            "coluna_inicial": fm.get("coluna_inicial"),
            "linha_inicial": fm.get("linha_inicial"),
            "largura_hex": fm.get("largura_hex"),
            "altura_hex": fm.get("altura_hex"),
        })

        for key in ["nome", "descricao", "sistema", "escala_hex", "hex_inicial"]:
            if campaign_fields.get(key) and fm.get(key) not in (None, ""):
                data[key] = fm.get(key)

        if campaign_fields.get("rumor_principal"):
            rumor = campaign.sections.get("Rumor principal", "")
            if rumor:
                data["rumor_principal"] = rumor

        return data

    def build_filtered_config(self, used: dict[str, set[str]]) -> dict[str, Any]:
        config: dict[str, Any] = {}

        for source_key in [
            "terrenos",
            "perigos",
            "exploracoes",
            "pontos_interesse",
            "conexoes",
            "estados_ponto_interesse",
        ]:
            ids = set(used[source_key])
            ids.update(CATALOG_DEFS[source_key]["always_include"])
            config[CATALOG_DEFS[source_key]["config_key"]] = self.export_catalog_items(source_key, ids)

        config["faccoes"] = {
            "controles": self.export_catalog_items("controles_faccao", used["controles_faccao"]),
            "relacoes": self.export_catalog_items("relacoes_faccao", used["relacoes_faccao"]),
        }

        config["fallback"] = dict(FALLBACK_CONFIG)

        return config

    def export_catalog_items(self, source_key: str, ids: set[str]) -> dict[str, Any]:
        result: dict[str, Any] = {}

        for item_id in sorted(ids):
            item = self.catalogs.item_by_id(source_key, item_id)

            if item is None:
                self.logger.warning(f"Item '{item_id}' foi usado, mas não existe no catálogo '{source_key}'.")
                continue

            if source_key == "pontos_interesse":
                self.validate_icon_path(item)

            result[item.id] = catalog_item_to_config(item)

        return result

    def validate_icon_path(self, item: CatalogItem) -> None:
        icon = item.data.get("icone")

        if not icon or not isinstance(icon, str):
            return

        if icon.startswith("http://") or icon.startswith("https://"):
            return

        normalized = icon
        if normalized.startswith("./"):
            normalized = normalized[2:]

        # output_path normalmente é a pasta data/. Os ícones do site ficam um nível acima, em /images.
        site_root = self.output_path.parent
        icon_path = site_root / normalized

        if not icon_path.exists():
            self.logger.warning(
                f"Ícone de POI não encontrado no site: {icon} "
                f"(catálogo: {item.note_name})"
            )



class HexExportTool:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Hex Viewer — Export Tool")
        self.root.geometry("1360x820")
        self.root.minsize(1120, 680)

        self.vault_path: Path | None = guess_vault_path()
        self.settings: dict[str, Any] = {}

        self.campaigns: list[CampaignInfo] = []
        self.campaign_vars: dict[str, tk.BooleanVar] = {}
        self.tabs: dict[str, CampaignTab] = {}
        self.profiles: dict[str, dict[str, str]] = {}

        self.vault_var = tk.StringVar(value=str(self.vault_path or ""))
        self.profile_var = tk.StringVar(value="")
        self.profile_label_var = tk.StringVar(value="Nenhum perfil carregado")
        self.output_var = tk.StringVar(value="")
        self.status_var = tk.StringVar(value="Escolha o vault do Obsidian.")
        self.log_visible = tk.BooleanVar(value=True)

        self.setup_style()
        self.build_ui()

        if self.vault_path is not None:
            self.after_vault_change()

    def setup_style(self) -> None:
        style = ttk.Style(self.root)

        try:
            if "clam" in style.theme_names():
                style.theme_use("clam")
        except Exception:
            pass

        style.configure(".", background=COLORS["bg"], foreground=COLORS["text"], fieldbackground=COLORS["entry"])
        style.configure("TFrame", background=COLORS["bg"])
        style.configure("Panel.TFrame", background=COLORS["panel"])
        style.configure("TLabel", background=COLORS["bg"], foreground=COLORS["text"])
        style.configure("Muted.TLabel", background=COLORS["bg"], foreground=COLORS["muted"])
        style.configure("PanelMuted.TLabel", background=COLORS["panel"], foreground=COLORS["muted"])
        style.configure("Title.TLabel", background=COLORS["panel"], foreground=COLORS["text"], font=("Segoe UI", 13, "bold"))
        style.configure("Header.TLabel", background=COLORS["bg"], foreground=COLORS["text"], font=("Segoe UI", 16, "bold"))
        style.configure("TButton", background=COLORS["panel2"], foreground=COLORS["text"], bordercolor=COLORS["line"], focusthickness=0, padding=7)
        style.map("TButton", background=[("active", COLORS["accent2"])])
        style.configure("Accent.TButton", background=COLORS["accent2"], foreground=COLORS["text"], padding=8)
        style.map("Accent.TButton", background=[("active", COLORS["accent"])])
        style.configure("TCheckbutton", background=COLORS["bg"], foreground=COLORS["text"])
        style.map("TCheckbutton", background=[("active", COLORS["bg"])])
        style.configure("TLabelframe", background=COLORS["panel"], foreground=COLORS["text"], bordercolor=COLORS["line"])
        style.configure("TLabelframe.Label", background=COLORS["panel"], foreground=COLORS["text"])
        style.configure("TNotebook", background=COLORS["bg"], borderwidth=0)
        style.configure("TNotebook.Tab", background=COLORS["panel2"], foreground=COLORS["text"], padding=(12, 7))
        style.map("TNotebook.Tab", background=[("selected", COLORS["panel"])])
        style.configure("TCombobox", fieldbackground=COLORS["entry"], background=COLORS["panel2"], foreground=COLORS["text"], arrowcolor=COLORS["text"])
        style.configure("TEntry", fieldbackground=COLORS["entry"], foreground=COLORS["text"], insertcolor=COLORS["text"])

        self.root.configure(bg=COLORS["bg"])

    def build_ui(self) -> None:
        self.root.columnconfigure(0, weight=0)
        self.root.columnconfigure(1, weight=1)
        self.root.rowconfigure(2, weight=1)

        header = ttk.Frame(self.root)
        header.grid(row=0, column=0, columnspan=2, sticky="ew", padx=14, pady=(12, 8))
        header.columnconfigure(1, weight=1)

        ttk.Label(header, text="Hex Viewer Export Tool", style="Header.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(header, textvariable=self.status_var, style="Muted.TLabel").grid(row=0, column=1, sticky="e")

        top = ttk.Frame(self.root)
        top.grid(row=1, column=0, columnspan=2, sticky="ew", padx=14, pady=(0, 10))
        top.columnconfigure(1, weight=1)

        ttk.Label(top, text="Vault").grid(row=0, column=0, sticky="w", padx=(0, 8), pady=4)
        ttk.Entry(top, textvariable=self.vault_var).grid(row=0, column=1, sticky="ew", pady=4)
        ttk.Button(top, text="Escolher", command=self.choose_vault).grid(row=0, column=2, padx=(8, 0), pady=4)

        ttk.Label(top, text="Perfil").grid(row=1, column=0, sticky="w", padx=(0, 8), pady=4)

        profile_row = ttk.Frame(top)
        profile_row.grid(row=1, column=1, columnspan=2, sticky="ew", pady=4)
        profile_row.columnconfigure(0, weight=0)
        profile_row.columnconfigure(1, weight=1)

        self.profile_combo = ttk.Combobox(profile_row, textvariable=self.profile_var, state="readonly", width=34)
        self.profile_combo.grid(row=0, column=0, sticky="w")
        self.profile_combo.bind("<<ComboboxSelected>>", lambda _event: self.on_profile_selected())

        ttk.Label(profile_row, textvariable=self.profile_label_var, style="Muted.TLabel").grid(
            row=0,
            column=1,
            sticky="w",
            padx=(10, 0),
        )

        ttk.Button(profile_row, text="Novo", command=self.create_profile).grid(row=0, column=2, padx=(8, 0))
        ttk.Button(profile_row, text="Duplicar", command=self.duplicate_profile).grid(row=0, column=3, padx=(8, 0))
        ttk.Button(profile_row, text="Renomear", command=self.rename_profile).grid(row=0, column=4, padx=(8, 0))
        ttk.Button(profile_row, text="Excluir", command=self.delete_profile).grid(row=0, column=5, padx=(8, 0))
        ttk.Button(profile_row, text="Recarregar", command=self.reload_profiles_and_campaigns).grid(row=0, column=6, padx=(8, 0))

        destino = ttk.Frame(top)
        destino.grid(row=2, column=0, columnspan=3, sticky="ew", pady=(4, 0))
        destino.columnconfigure(1, weight=1)

        ttk.Label(destino, text="Destino data/").grid(row=0, column=0, sticky="w", padx=(0, 8))
        ttk.Label(destino, textvariable=self.output_var, style="Muted.TLabel").grid(row=0, column=1, sticky="ew")
        ttk.Button(destino, text="Alterar", command=self.choose_output).grid(row=0, column=2, padx=(8, 0))
        ttk.Button(destino, text="Abrir pasta", command=self.open_output_folder).grid(row=0, column=3, padx=(8, 0))

        left = ttk.Frame(self.root, style="Panel.TFrame")
        left.grid(row=2, column=0, sticky="nsew", padx=(14, 7), pady=(0, 10))
        left.rowconfigure(2, weight=1)
        left.columnconfigure(0, weight=1)

        ttk.Label(left, text="Campanhas", style="Title.TLabel").grid(row=0, column=0, sticky="w", padx=10, pady=(10, 4))
        ttk.Label(
            left,
            text="Marque quais campanhas entram nesse perfil.",
            style="PanelMuted.TLabel",
            wraplength=270,
        ).grid(row=1, column=0, sticky="ew", padx=10, pady=(0, 8))

        self.campaigns_frame = tk.Frame(left, bg=COLORS["panel"])
        self.campaigns_frame.grid(row=2, column=0, sticky="nsew", padx=10, pady=(0, 8))

        left_actions = ttk.Frame(left, style="Panel.TFrame")
        left_actions.grid(row=3, column=0, sticky="ew", padx=10, pady=(0, 10))

        ttk.Button(left_actions, text="Carregar marcadas", command=self.load_selected_campaigns).pack(fill="x", pady=(0, 6))
        ttk.Button(left_actions, text="Salvar perfil", command=self.save_profiles).pack(fill="x", pady=(0, 6))
        ttk.Button(left_actions, text="Exportar JSON", command=self.export_now, style="Accent.TButton").pack(fill="x")

        right = ttk.Frame(self.root)
        right.grid(row=2, column=1, sticky="nsew", padx=(7, 14), pady=(0, 10))
        right.rowconfigure(0, weight=1)
        right.columnconfigure(0, weight=1)

        self.notebook = ttk.Notebook(right)
        self.notebook.grid(row=0, column=0, sticky="nsew")

        self.empty_tab = ttk.Frame(self.notebook, style="Panel.TFrame")
        self.notebook.add(self.empty_tab, text="Início")
        ttk.Label(
            self.empty_tab,
            text=(
                "1. Escolha o vault.\n"
                "2. Escolha ou crie um perfil.\n"
                "3. Marque campanhas e carregue.\n"
                "4. Revise os hexes, salve o perfil e exporte."
            ),
            style="Title.TLabel",
            justify="left",
        ).pack(anchor="nw", padx=24, pady=24)

        log_panel = ttk.Frame(self.root)
        log_panel.grid(row=3, column=0, columnspan=2, sticky="ew", padx=14, pady=(0, 12))
        log_panel.columnconfigure(0, weight=1)

        self.log = tk.Text(
            log_panel,
            height=7,
            bg=COLORS["entry"],
            fg=COLORS["text"],
            insertbackground=COLORS["text"],
            relief="flat",
            wrap="word",
            padx=8,
            pady=8,
        )
        self.log.grid(row=0, column=0, sticky="ew")

    def choose_vault(self) -> None:
        selected = filedialog.askdirectory(title="Escolha a pasta do vault do Obsidian")
        if not selected:
            return

        self.vault_path = Path(selected).resolve()
        self.vault_var.set(str(self.vault_path))
        self.after_vault_change()

    def choose_output(self) -> None:
        initial = self.output_var.get() or str(Path.cwd())
        selected = filedialog.askdirectory(title="Escolha a pasta data/ do Hex Viewer", initialdir=initial)
        if not selected:
            return

        self.output_var.set(str(Path(selected).resolve()))
        self.save_tool_settings()

    def open_output_folder(self) -> None:
        try:
            output = Path(self.output_var.get()).expanduser().resolve()
            open_folder(output)
        except Exception as exc:
            messagebox.showerror("Erro ao abrir pasta", str(exc))

    def after_vault_change(self) -> None:
        if self.vault_path is None:
            return

        self.settings = self.load_tool_settings()
        output = self.settings.get("output_path")

        if not output:
            output = str(self.guess_output_path())

        self.output_var.set(output)

        self.scan_campaigns()
        self.load_profiles()

        if self.profile_combo["values"]:
            current = self.settings.get("last_profile")
            values = list(self.profile_combo["values"])
            if current in values:
                self.profile_var.set(current)
            else:
                self.profile_var.set(values[0])
            self.on_profile_selected()
        else:
            self.profile_var.set("")
            self.profile_label_var.set("Nenhum perfil encontrado. Crie um perfil.")
            self.render_campaign_list(set())

        self.status_var.set(f"Vault carregado: {self.vault_path.name}")

    def reload_profiles_and_campaigns(self) -> None:
        if not self.ensure_vault():
            return

        self.scan_campaigns()
        self.load_profiles()

        if self.profile_var.get():
            self.on_profile_selected()

        self.write_log("Campanhas e perfis recarregados.")

    def ensure_vault(self) -> bool:
        try:
            vault = Path(self.vault_var.get()).expanduser().resolve()
            if not vault.exists():
                raise FileNotFoundError(f"Pasta não encontrada: {vault}")
            self.vault_path = vault
            return True
        except Exception as exc:
            messagebox.showerror("Vault inválido", str(exc))
            return False

    def scan_campaigns(self) -> None:
        if self.vault_path is None:
            return

        self.campaigns = find_campaigns(self.vault_path)
        self.status_var.set(f"{len(self.campaigns)} campanha(s) encontrada(s).")

    def load_profiles(self) -> None:
        self.profiles.clear()

        if self.vault_path is None:
            return

        export_folder = self.vault_path / "Exportacoes"
        export_folder.mkdir(parents=True, exist_ok=True)

        for file_path in sorted(export_folder.glob("*.json")):
            if file_path.name.startswith("_"):
                continue

            try:
                data = read_json(file_path)
            except Exception:
                continue

            profile_id = str(data.get("profile_id") or file_path.stem)
            profile_name = str(data.get("profile_name") or profile_id)

            self.profiles[profile_id] = {
                "id": profile_id,
                "name": profile_name,
                "path": str(file_path),
                "label": f"{profile_name} ({profile_id})",
            }

        values = list(self.profiles.keys())
        self.profile_combo["values"] = values

    def on_profile_selected(self) -> None:
        profile_id = self.profile_var.get()

        if not profile_id:
            self.profile_label_var.set("Nenhum perfil selecionado")
            return

        profile = self.profiles.get(profile_id)
        if profile:
            self.profile_label_var.set(profile["name"])
        else:
            self.profile_label_var.set(profile_id)

        self.settings["last_profile"] = profile_id
        self.save_tool_settings()

        root_profile = self.load_root_profile(profile_id)
        selected_ids = set(root_profile.get("selected_campaign_ids", []))
        self.render_campaign_list(selected_ids)

        self.load_selected_campaigns(silent=True)

    def create_profile(self) -> None:
        if not self.ensure_vault():
            return

        name = simpledialog.askstring("Novo perfil", "Nome do perfil:", initialvalue="Jogadores")

        if not name:
            return

        profile_id = slugify(name)
        export_folder = self.vault_path / "Exportacoes"
        export_folder.mkdir(parents=True, exist_ok=True)

        root_profile_path = export_folder / f"{profile_id}.json"

        if root_profile_path.exists():
            messagebox.showwarning(
                "Perfil já existe",
                f"Já existe um perfil com esse ID:\n{profile_id}",
            )
            return

        root_profile = {
            "schema_version": PROFILE_VERSION,
            "profile_id": profile_id,
            "profile_name": name,
            "updated_at": datetime.now().isoformat(timespec="seconds"),
            "selected_campaign_ids": [],
            "campaigns": [],
        }
        write_json(root_profile_path, root_profile)

        self.load_profiles()
        self.profile_var.set(profile_id)
        self.on_profile_selected()
        self.write_log(f"Perfil criado: {name} ({profile_id})")

    def duplicate_profile(self) -> None:
        if not self.ensure_vault():
            return

        old_id = self.profile_var.get()
        if not old_id:
            messagebox.showwarning("Sem perfil", "Selecione um perfil para duplicar.")
            return

        self.save_profiles_without_dialog()
        old_name = self.profiles.get(old_id, {}).get("name", old_id)
        new_name = simpledialog.askstring("Duplicar perfil", "Nome do novo perfil:", initialvalue=f"{old_name} - cópia")

        if not new_name:
            return

        new_id = slugify(new_name)
        target = self.vault_path / "Exportacoes" / f"{new_id}.json"

        if target.exists():
            messagebox.showwarning("Perfil já existe", f"Já existe um perfil com esse nome/ID:\n{new_id}")
            return

        self.copy_profile(old_id, new_id, new_name)
        self.load_profiles()
        self.profile_var.set(new_id)
        self.on_profile_selected()
        self.write_log(f"Perfil duplicado: {old_name} → {new_name}")

    def rename_profile(self) -> None:
        if not self.ensure_vault():
            return

        old_id = self.profile_var.get()
        if not old_id:
            messagebox.showwarning("Sem perfil", "Selecione um perfil para renomear.")
            return

        self.save_profiles_without_dialog()
        old_name = self.profiles.get(old_id, {}).get("name", old_id)
        new_name = simpledialog.askstring("Renomear perfil", "Novo nome:", initialvalue=old_name)

        if not new_name:
            return

        new_id = slugify(new_name)

        if new_id != old_id and (self.vault_path / "Exportacoes" / f"{new_id}.json").exists():
            messagebox.showwarning("Perfil já existe", f"Já existe um perfil com esse nome/ID:\n{new_id}")
            return

        self.copy_profile(old_id, new_id, new_name)

        if new_id != old_id:
            self.delete_profile_files(old_id)

        self.load_profiles()
        self.profile_var.set(new_id)
        self.on_profile_selected()
        self.write_log(f"Perfil renomeado: {old_name} → {new_name}")

    def delete_profile(self) -> None:
        if not self.ensure_vault():
            return

        profile_id = self.profile_var.get()
        if not profile_id:
            messagebox.showwarning("Sem perfil", "Selecione um perfil para excluir.")
            return

        profile_name = self.profiles.get(profile_id, {}).get("name", profile_id)
        confirmed = messagebox.askyesno(
            "Excluir perfil",
            f"Excluir o perfil '{profile_name}'?\n\nIsso remove os arquivos JSON de perfil no vault, mas não mexe nos hexes nem no site.",
        )

        if not confirmed:
            return

        self.delete_profile_files(profile_id)
        self.load_profiles()

        values = list(self.profile_combo["values"])
        if values:
            self.profile_var.set(values[0])
            self.on_profile_selected()
        else:
            self.profile_var.set("")
            self.profile_label_var.set("Nenhum perfil encontrado. Crie um perfil.")
            self.render_campaign_list(set())
            self.load_selected_campaigns(silent=True)

        self.write_log(f"Perfil excluído: {profile_name}")

    def copy_profile(self, source_id: str, target_id: str, target_name: str) -> None:
        if self.vault_path is None:
            return

        source_root_path = self.vault_path / "Exportacoes" / f"{source_id}.json"
        if not source_root_path.exists():
            raise FileNotFoundError(f"Perfil de origem não encontrado: {source_root_path}")

        source_root = read_json(source_root_path)
        target_root = json.loads(json.dumps(source_root))
        target_root["profile_id"] = target_id
        target_root["profile_name"] = target_name
        target_root["updated_at"] = datetime.now().isoformat(timespec="seconds")
        target_root["campaigns"] = []

        for entry in source_root.get("campaigns", []):
            campaign_folder = self.vault_path / str(entry.get("campaign_folder", ""))
            source_campaign_profile_path = self.vault_path / str(entry.get("profile_path", ""))

            if not campaign_folder.exists() or not source_campaign_profile_path.exists():
                continue

            campaign_profile = read_json(source_campaign_profile_path)
            campaign_profile["profile_id"] = target_id
            campaign_profile["profile_name"] = target_name
            campaign_profile["updated_at"] = datetime.now().isoformat(timespec="seconds")

            target_campaign_profile_path = campaign_folder / "Exportacoes" / f"{target_id}.json"
            target_campaign_profile_path.parent.mkdir(parents=True, exist_ok=True)
            write_json(target_campaign_profile_path, campaign_profile)

            new_entry = dict(entry)
            new_entry["profile_path"] = to_posix_rel(self.vault_path, target_campaign_profile_path)
            target_root["campaigns"].append(new_entry)

        target_root_path = self.vault_path / "Exportacoes" / f"{target_id}.json"
        target_root_path.parent.mkdir(parents=True, exist_ok=True)
        write_json(target_root_path, target_root)

    def delete_profile_files(self, profile_id: str) -> None:
        if self.vault_path is None:
            return

        root_profile_path = self.vault_path / "Exportacoes" / f"{profile_id}.json"

        if root_profile_path.exists():
            try:
                root_profile = read_json(root_profile_path)
            except Exception:
                root_profile = {}

            for entry in root_profile.get("campaigns", []):
                profile_path = self.vault_path / str(entry.get("profile_path", ""))
                if profile_path.exists() and profile_path.name == f"{profile_id}.json":
                    profile_path.unlink()

            root_profile_path.unlink()

        for campaign_profile_path in (self.vault_path / "Campanhas").glob(f"*/Exportacoes/{profile_id}.json"):
            if campaign_profile_path.exists():
                campaign_profile_path.unlink()

    def render_campaign_list(self, selected_ids: set[str]) -> None:
        for child in self.campaigns_frame.winfo_children():
            child.destroy()

        self.campaign_vars.clear()

        if not self.campaigns:
            tk.Label(
                self.campaigns_frame,
                text="Nenhuma campanha encontrada em Campanhas/*/_campaign.md",
                bg=COLORS["panel"],
                fg=COLORS["muted"],
                justify="left",
                wraplength=260,
            ).pack(anchor="w", pady=8)
            return

        for index, campaign in enumerate(self.campaigns):
            initial = campaign.id in selected_ids
            var = tk.BooleanVar(value=initial)
            self.campaign_vars[campaign.id] = var

            row = tk.Frame(self.campaigns_frame, bg=COLORS["panel"])
            row.pack(fill="x", pady=4)

            cb = ttk.Checkbutton(row, variable=var)
            cb.pack(side="left", padx=(0, 4))

            label_text = f"{campaign.nome}\n{campaign.id} · {len(campaign.hexes)} hexes"
            tk.Label(
                row,
                text=label_text,
                bg=COLORS["panel"],
                fg=COLORS["text"],
                justify="left",
                anchor="w",
            ).pack(side="left", fill="x", expand=True)

    def load_selected_campaigns(self, silent: bool = False) -> None:
        if not self.campaigns:
            if not silent:
                messagebox.showwarning("Nenhuma campanha", "Nenhuma campanha foi encontrada.")
            return

        selected = [
            campaign
            for campaign in self.campaigns
            if self.campaign_vars.get(campaign.id, tk.BooleanVar(value=False)).get()
        ]

        if not selected:
            for tab_id in self.notebook.tabs():
                self.notebook.forget(tab_id)
            self.tabs.clear()
            self.notebook.add(self.empty_tab, text="Início")
            if not silent:
                messagebox.showwarning("Nenhuma campanha marcada", "Marque pelo menos uma campanha.")
            return

        for tab_id in self.notebook.tabs():
            self.notebook.forget(tab_id)

        self.tabs.clear()

        profile_id = self.profile_var.get() or "jogadores"

        for campaign in selected:
            existing = self.load_campaign_profile(campaign, profile_id)
            tab = CampaignTab(self, self.notebook, campaign, existing)
            self.tabs[campaign.id] = tab

        if not silent:
            self.write_log(f"{len(selected)} campanha(s) carregada(s).")

    def save_profiles(self) -> None:
        if not self.ensure_vault():
            return

        profile_id = self.profile_var.get()

        if not profile_id:
            messagebox.showwarning("Sem perfil", "Crie ou selecione um perfil.")
            return

        if not self.tabs:
            self.load_selected_campaigns(silent=True)

        if not self.tabs:
            messagebox.showwarning("Nada carregado", "Marque e carregue pelo menos uma campanha.")
            return

        profile_name = self.profiles.get(profile_id, {}).get("name", profile_id)

        selected_campaign_ids = [
            campaign.id
            for campaign in self.campaigns
            if self.campaign_vars.get(campaign.id, tk.BooleanVar(value=False)).get()
        ]

        root_export_folder = self.vault_path / "Exportacoes"
        root_export_folder.mkdir(parents=True, exist_ok=True)

        root_profile = {
            "schema_version": PROFILE_VERSION,
            "profile_id": profile_id,
            "profile_name": profile_name,
            "updated_at": datetime.now().isoformat(timespec="seconds"),
            "selected_campaign_ids": selected_campaign_ids,
            "campaigns": [],
        }

        for campaign_id, tab in self.tabs.items():
            profile = tab.to_profile(profile_id, profile_name)

            campaign_export_folder = tab.campaign.folder / "Exportacoes"
            campaign_export_folder.mkdir(parents=True, exist_ok=True)

            profile_path = campaign_export_folder / f"{profile_id}.json"
            write_json(profile_path, profile)

            root_profile["campaigns"].append({
                "campaign_id": tab.campaign.id,
                "campaign_name": tab.campaign.nome,
                "campaign_folder": to_posix_rel(self.vault_path, tab.campaign.folder),
                "profile_path": to_posix_rel(self.vault_path, profile_path),
                "export_enabled": tab.campaign.id in selected_campaign_ids,
            })

        root_profile_path = root_export_folder / f"{profile_id}.json"
        write_json(root_profile_path, root_profile)

        self.load_profiles()
        self.profile_var.set(profile_id)
        self.settings["last_profile"] = profile_id
        self.save_tool_settings()

        self.write_log(f"Perfil salvo: {root_profile_path}")
        messagebox.showinfo("Perfil salvo", "Perfil salvo com sucesso.")

    def export_now(self) -> None:
        if not self.ensure_vault():
            return

        profile_id = self.profile_var.get()
        if not profile_id:
            messagebox.showwarning("Sem perfil", "Selecione ou crie um perfil.")
            return

        # Salva antes de exportar para garantir que as marcações atuais sejam usadas.
        self.save_profiles_without_dialog()

        try:
            output = Path(self.output_var.get()).expanduser().resolve()
            self.settings["output_path"] = str(output)
            self.settings["last_profile"] = profile_id
            self.save_tool_settings()

            runner = ExportRunner(self.vault_path, output, profile_id, self.site_base_from_output(output))
            text = runner.export()
            self.write_log(text)
            messagebox.showinfo("Exportação concluída", "JSON público exportado com sucesso.")
        except Exception as exc:
            self.write_log(f"ERRO: {exc}")
            messagebox.showerror("Erro na exportação", str(exc))


    def site_base_from_output(self, output: Path) -> str:
        """Calcula o caminho usado dentro do campaigns.json.

        Ex.:
        - /repo/data            -> ./data
        - /repo/data-jogadores  -> ./data-jogadores
        - /repo/data-mestre     -> ./data-mestre
        """
        name = output.name.strip() or "data"
        return f"./{name}"

    def save_profiles_without_dialog(self) -> None:
        profile_id = self.profile_var.get()
        if not profile_id or not self.tabs or self.vault_path is None:
            return

        profile_name = self.profiles.get(profile_id, {}).get("name", profile_id)
        selected_campaign_ids = [
            campaign.id
            for campaign in self.campaigns
            if self.campaign_vars.get(campaign.id, tk.BooleanVar(value=False)).get()
        ]

        root_export_folder = self.vault_path / "Exportacoes"
        root_export_folder.mkdir(parents=True, exist_ok=True)

        root_profile = {
            "schema_version": PROFILE_VERSION,
            "profile_id": profile_id,
            "profile_name": profile_name,
            "updated_at": datetime.now().isoformat(timespec="seconds"),
            "selected_campaign_ids": selected_campaign_ids,
            "campaigns": [],
        }

        for campaign_id, tab in self.tabs.items():
            profile = tab.to_profile(profile_id, profile_name)
            campaign_export_folder = tab.campaign.folder / "Exportacoes"
            campaign_export_folder.mkdir(parents=True, exist_ok=True)
            profile_path = campaign_export_folder / f"{profile_id}.json"
            write_json(profile_path, profile)

            root_profile["campaigns"].append({
                "campaign_id": tab.campaign.id,
                "campaign_name": tab.campaign.nome,
                "campaign_folder": to_posix_rel(self.vault_path, tab.campaign.folder),
                "profile_path": to_posix_rel(self.vault_path, profile_path),
                "export_enabled": tab.campaign.id in selected_campaign_ids,
            })

        write_json(root_export_folder / f"{profile_id}.json", root_profile)

    def load_root_profile(self, profile_id: str) -> dict[str, Any]:
        if self.vault_path is None:
            return {}

        path = self.vault_path / "Exportacoes" / f"{profile_id}.json"

        if not path.exists():
            return {}

        try:
            return read_json(path)
        except Exception:
            return {}

    def load_campaign_profile(self, campaign: CampaignInfo, profile_id: str) -> dict[str, Any]:
        path = campaign.folder / "Exportacoes" / f"{profile_id}.json"

        if not path.exists():
            return {}

        try:
            return read_json(path)
        except Exception as exc:
            messagebox.showwarning("Perfil inválido", f"Não consegui ler:\n{path}\n\n{exc}")
            return {}

    def load_tool_settings(self) -> dict[str, Any]:
        if self.vault_path is None:
            return {}

        path = self.vault_path / "Exportacoes" / "_tool_settings.json"

        if not path.exists():
            return {}

        try:
            return read_json(path)
        except Exception:
            return {}

    def save_tool_settings(self) -> None:
        if self.vault_path is None:
            return

        folder = self.vault_path / "Exportacoes"
        folder.mkdir(parents=True, exist_ok=True)
        data = {
            "app_version": APP_VERSION,
            "output_path": self.output_var.get(),
            "last_profile": self.profile_var.get(),
        }
        write_json(folder / "_tool_settings.json", data)

    def guess_output_path(self) -> Path:
        if self.vault_path is None:
            return Path.cwd() / "data"

        candidates = [
            self.vault_path.parent / "Hex-Viewer" / "data",
            self.vault_path.parent / "Hex Viewer" / "data",
            self.vault_path.parent / "hex-viewer" / "data",
            Path.cwd() / "data",
        ]

        for candidate in candidates:
            if candidate.exists():
                return candidate.resolve()

        return (self.vault_path / "Exportado" / "data").resolve()

    def write_log(self, text: str) -> None:
        self.log.delete("1.0", "end")
        self.log.insert("end", text)


def backup_json_files(output_path: Path, logger: AppLogger) -> Path | None:
    if not output_path.exists():
        logger.info("Backup: pasta de saída ainda não existe; nada para copiar.")
        return None

    json_files = [
        file_path
        for file_path in output_path.rglob("*.json")
        if "_backups" not in file_path.parts
    ]

    if not json_files:
        logger.info("Backup: nenhum JSON existente encontrado na pasta de saída.")
        return None

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_root = output_path / "_backups" / timestamp

    for file_path in json_files:
        relative = file_path.relative_to(output_path)
        destination = backup_root / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file_path, destination)

    logger.info(f"Backup criado: {backup_root}")
    logger.info(f"JSONs copiados no backup: {len(json_files)}")
    return backup_root


def open_folder(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)

    system = platform.system().lower()

    if system == "windows":
        os.startfile(str(path))  # type: ignore[attr-defined]
        return

    if system == "darwin":
        subprocess.Popen(["open", str(path)])
        return

    subprocess.Popen(["xdg-open", str(path)])


def find_campaigns(vault_path: Path) -> list[CampaignInfo]:
    campaigns_root = vault_path / "Campanhas"

    if not campaigns_root.exists():
        return []

    campaigns: list[CampaignInfo] = []

    for campaign_file in campaigns_root.glob("*/_campaign.md"):
        campaign_folder = campaign_file.parent
        campaign_data = parse_markdown_file(campaign_file)

        campaign = CampaignInfo(
            folder=campaign_folder,
            campaign_file=campaign_file,
            frontmatter=campaign_data["frontmatter"],
            sections=campaign_data["sections"],
            hexes=[],
        )

        campaign.hexes = find_hexes(campaign_folder)
        campaigns.append(campaign)

    campaigns.sort(key=lambda item: item.nome.lower())
    return campaigns


def find_hexes(campaign_folder: Path) -> list[HexInfo]:
    hexes_folder = campaign_folder / "Hexes"

    if not hexes_folder.exists():
        return []

    hexes: list[HexInfo] = []

    for file_path in hexes_folder.glob("*.md"):
        parsed = parse_markdown_file(file_path)
        frontmatter = parsed["frontmatter"]
        hex_id = str(frontmatter.get("hex") or file_path.stem)

        hexes.append(HexInfo(
            hex_id=hex_id,
            file_path=file_path,
            frontmatter=frontmatter,
            sections=parsed["sections"],
        ))

    hexes.sort(key=lambda item: parse_hex_sort_key(item.hex_id))
    return hexes


def load_campaign(campaign_folder: Path) -> CampaignInfo:
    campaign_file = campaign_folder / "_campaign.md"
    parsed = parse_markdown_file(campaign_file)

    campaign = CampaignInfo(
        folder=campaign_folder,
        campaign_file=campaign_file,
        frontmatter=parsed["frontmatter"],
        sections=parsed["sections"],
        hexes=[],
    )
    campaign.hexes = find_hexes(campaign_folder)

    return campaign


def parse_markdown_file(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    frontmatter_text, body = split_frontmatter(text)

    return {
        "frontmatter": parse_simple_yaml(frontmatter_text),
        "sections": parse_sections(body),
        "body": body,
    }


def split_frontmatter(text: str) -> tuple[str, str]:
    match = re.match(r"^---\s*\n([\s\S]*?)\n---\s*", text)

    if not match:
        return "", text

    return match.group(1), text[match.end():]


def parse_simple_yaml(text: str) -> dict[str, Any]:
    data: dict[str, Any] = {}

    for raw_line in text.splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#"):
            continue

        if ":" not in line:
            continue

        key, raw_value = line.split(":", 1)
        data[key.strip()] = parse_yaml_value(raw_value.strip())

    return data


def parse_yaml_value(value: str) -> Any:
    if value == "":
        return ""

    lower = value.lower()

    if lower == "true":
        return True

    if lower == "false":
        return False

    if lower == "null":
        return None

    if (
        (value.startswith('"') and value.endswith('"'))
        or (value.startswith("'") and value.endswith("'"))
    ):
        try:
            return json.loads(value)
        except Exception:
            return value[1:-1]

    if re.fullmatch(r"-?\d+", value):
        return int(value)

    if re.fullmatch(r"-?\d+\.\d+", value):
        return float(value)

    return value


def parse_sections(body: str) -> dict[str, str]:
    sections: dict[str, str] = {}
    current_title: str | None = None
    current_lines: list[str] = []

    for line in body.splitlines():
        heading = re.match(r"^##\s+(.+?)\s*$", line)

        if heading:
            if current_title is not None:
                sections[current_title] = "\n".join(current_lines).strip()

            current_title = heading.group(1).strip()
            current_lines = []
            continue

        if current_title is not None:
            current_lines.append(line)

    if current_title is not None:
        sections[current_title] = "\n".join(current_lines).strip()

    return sections


def catalog_item_to_config(item: CatalogItem) -> dict[str, Any]:
    excluded = {"fileClass", "id"}
    config = {}

    for key, value in item.data.items():
        if key in excluded:
            continue

        if value is None or value == "":
            continue

        config[key] = value

    if "label" not in config:
        config["label"] = item.label

    return config


def clean_object(data: dict[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {}

    for key, value in data.items():
        if value is None:
            continue

        if isinstance(value, str) and value.strip() == "":
            continue

        if isinstance(value, dict) and not value:
            continue

        if isinstance(value, list) and not value:
            continue

        result[key] = value

    return result


def extract_wikilink_name(value: Any) -> str:
    text = str(value or "").strip()

    match = re.match(r"^\[\[(.+?)\]\]$", text)
    if not match:
        return text

    inner = match.group(1)

    if "|" in inner:
        inner = inner.split("|", 1)[0]

    if "/" in inner:
        inner = inner.rsplit("/", 1)[-1]

    return inner.strip()


def clean_link(value: Any) -> str:
    return extract_wikilink_name(value)


def normalize_link_key(value: Any) -> str:
    return remove_accents(str(value or "")).lower().strip()


def one_line(text: str, limit: int) -> str:
    clean = re.sub(r"\s+", " ", str(text or "")).strip()

    if len(clean) <= limit:
        return clean

    return clean[: max(0, limit - 1)] + "…"


def slugify(text: str, separator: str = "-") -> str:
    value = remove_accents(text)
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", separator, value)
    value = value.strip(separator)
    return value or "perfil"


def remove_accents(text: str) -> str:
    import unicodedata

    normalized = unicodedata.normalize("NFD", str(text))
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn")


def parse_hex_sort_key(hex_id: str) -> tuple[int, int, str]:
    match = re.match(r"^([A-Za-z]+)(\d+)$", str(hex_id))

    if not match:
        return (999999, 999999, str(hex_id))

    col = letters_to_number(match.group(1).upper())
    row = int(match.group(2))

    return (col, row, str(hex_id))


def letters_to_number(letters: str) -> int:
    value = 0

    for char in letters:
        value *= 26
        value += ord(char) - 64

    return value


def to_posix_rel(root: Path, path: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def guess_vault_path() -> Path | None:
    current = Path.cwd()

    candidates = [
        current,
        current / "Obsidian Hexmaps - Catalogos",
        current / "Obsidian Hexmaps",
    ]

    for candidate in candidates:
        if (candidate / "Campanhas").exists() and (candidate / "Catalogos").exists():
            return candidate.resolve()

    return None


def main() -> int:
    root = tk.Tk()
    HexExportTool(root)
    root.mainloop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
