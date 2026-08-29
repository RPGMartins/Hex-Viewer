@echo off
cd /d "%~dp0"
echo Instalando/atualizando PyInstaller...
python -m pip install --upgrade pyinstaller
echo.
echo Gerando EXE unico...
python -m PyInstaller --onefile --windowed --name HexExportTool hex_export_tool.py
echo.
echo Pronto. O executavel fica em:
echo dist\HexExportTool.exe
pause
