#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Launcher seguro do exportador para uso a partir do Obsidian.

Ele NÃO substitui o hex_export_tool.py.
Ele abre o exportador original, mas força algumas convenções:

- Vault padrão: <repo>/obsidian-base
- Pasta de saída automática:
    perfil jogadores -> <repo>/data-jogadores
    perfil mestre    -> <repo>/data-mestre
    perfil qualquer  -> <repo>/data-<perfil>
- O botão "Alterar" não deixa você escolher uma pasta errada; ele só mostra/reset o destino automático.
- Ao exportar, ele força novamente o destino correto.

Uso:
    python tools/hex_export_obsidian_launcher.py
"""

from __future__ import annotations

import os
import re
import sys
import tkinter as tk
import unicodedata
from pathlib import Path
from tkinter import messagebox


TOOLS_DIR = Path(__file__).resolve().parent
REPO_ROOT = TOOLS_DIR.parent
DEFAULT_VAULT = REPO_ROOT / "obsidian-base"


def slugify(text: str) -> str:
    value = unicodedata.normalize("NFD", str(text or "perfil"))
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "perfil"


def resolve_vault() -> Path:
    env_vault = os.environ.get("HEX_OBSIDIAN_VAULT", "").strip()

    if env_vault:
        candidate = Path(env_vault).expanduser().resolve()
        if candidate.exists():
            return candidate

    return DEFAULT_VAULT.resolve()


def output_for_profile(profile_id: str) -> Path:
    profile_slug = slugify(profile_id)
    return (REPO_ROOT / f"data-{profile_slug}").resolve()


def patch_export_tool(module, vault_path: Path) -> None:
    original_guess_vault_path = getattr(module, "guess_vault_path")
    original_after_vault_change = module.HexExportTool.after_vault_change
    original_on_profile_selected = module.HexExportTool.on_profile_selected
    original_create_profile = module.HexExportTool.create_profile
    original_choose_output = module.HexExportTool.choose_output
    original_export_now = module.HexExportTool.export_now
    original_save_tool_settings = module.HexExportTool.save_tool_settings
    original_open_output_folder = module.HexExportTool.open_output_folder

    def patched_guess_vault_path():
        if vault_path.exists():
            return vault_path
        return original_guess_vault_path()

    def force_output_to_profile(self) -> None:
        profile_id = ""

        try:
            profile_id = self.profile_var.get()
        except Exception:
            profile_id = ""

        if profile_id:
            self.output_var.set(str(output_for_profile(profile_id)))
        else:
            self.output_var.set(str((REPO_ROOT / "data").resolve()))

    def patched_after_vault_change(self):
        original_after_vault_change(self)
        force_output_to_profile(self)
        try:
            original_save_tool_settings(self)
        except Exception:
            pass

    def patched_on_profile_selected(self):
        original_on_profile_selected(self)
        force_output_to_profile(self)
        try:
            original_save_tool_settings(self)
        except Exception:
            pass

    def patched_create_profile(self):
        original_create_profile(self)
        force_output_to_profile(self)
        try:
            original_save_tool_settings(self)
        except Exception:
            pass

    def patched_choose_output(self):
        force_output_to_profile(self)
        messagebox.showinfo(
            "Destino automático",
            "Nesta versão aberta pelo Obsidian, o destino é automático:\n\n"
            f"{self.output_var.get()}\n\n"
            "Regra:\n"
            "perfil jogadores → data-jogadores\n"
            "perfil mestre → data-mestre\n"
            "outros perfis → data-<nome-do-perfil>",
        )

    def patched_export_now(self):
        force_output_to_profile(self)
        return original_export_now(self)

    def patched_save_tool_settings(self):
        force_output_to_profile(self)
        return original_save_tool_settings(self)

    def patched_open_output_folder(self):
        force_output_to_profile(self)
        return original_open_output_folder(self)

    module.guess_vault_path = patched_guess_vault_path
    module.HexExportTool.after_vault_change = patched_after_vault_change
    module.HexExportTool.on_profile_selected = patched_on_profile_selected
    module.HexExportTool.create_profile = patched_create_profile
    module.HexExportTool.choose_output = patched_choose_output
    module.HexExportTool.export_now = patched_export_now
    module.HexExportTool.save_tool_settings = patched_save_tool_settings
    module.HexExportTool.open_output_folder = patched_open_output_folder


def main() -> int:
    vault_path = resolve_vault()

    sys.path.insert(0, str(TOOLS_DIR))
    import hex_export_tool  # type: ignore

    patch_export_tool(hex_export_tool, vault_path)

    root = tk.Tk()
    hex_export_tool.HexExportTool(root)
    root.mainloop()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
