@echo off
cd /d "%~dp0\.."

set "HEX_OBSIDIAN_VAULT=%~dp0..\obsidian-base"

python tools\criar_hexes_vazios.py --vault "%HEX_OBSIDIAN_VAULT%"

echo.
pause
