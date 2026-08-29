Hex Export Tool unificado — v2

Este pacote substitui a versão anterior do exportador.

Arquivos:
- hex_export_tool.py
- executar.bat
- gerar_exe_windows.bat
- GITIGNORE-SUGESTAO.txt

Como rodar:
1. Clique em executar.bat
   ou rode:
   python hex_export_tool.py

Como gerar EXE único no Windows:
1. Clique em gerar_exe_windows.bat
2. O executável será criado em:
   dist/HexExportTool.exe

Novidades desta versão:
- Validação antes da exportação.
- Erros graves bloqueiam a exportação.
- Avisos aparecem no log.
- Backup automático de todos os JSONs existentes antes de sobrescrever.
- Botão Abrir pasta para abrir o destino data/.
- Perfil agora tem ações:
  - Novo
  - Duplicar
  - Renomear
  - Excluir
- README/gitignore sugerido para organizar o projeto no Git.

Fluxo recomendado:
1. Edite campanhas, hexes e catálogos no Obsidian.
2. Abra o Hex Export Tool.
3. Escolha o vault.
4. Escolha/crie um perfil.
5. Marque campanhas e campos públicos.
6. Clique em Salvar perfil.
7. Clique em Exportar JSON.
8. Abra a pasta data/ e confira.
9. Commit nos arquivos públicos do site.

Validação:
O exportador bloqueia quando encontra problemas como:
- Campanha com largura/altura inválidas.
- Hex duplicado.
- Perfil tentando exportar hex que não existe.
- Link quebrado em terreno/perigo/exploração/POI/facção.
- Feature marcada como true sem uma conexão correspondente em Catalogos/Conexoes.

O exportador avisa, mas não bloqueia, em casos como:
- Campo marcado para exportar, mas vazio.
- Nenhum hex marcado numa campanha.
- Ícone de POI não encontrado na pasta images/ do site.

Backups:
Antes de exportar, ele copia todos os JSONs existentes em data/ para:

data/_backups/AAAAMMDD-HHMMSS/

Recomendo ignorar essa pasta no Git.

Organização recomendada no Git:
- Site do Hex Viewer:
  index.html
  styles.css
  script.js
  js/
  images/
  data/                 <- só dados públicos exportados

- Base Obsidian pública/modelo:
  Templates/
  Classes/
  Catalogos/
  README-CATALOGOS.md

- Ferramenta Python:
  hex_export_tool.py
  ou dist/HexExportTool.exe

Evite versionar:
- Campanhas reais privadas do mestre.
- Exportacoes/ do vault.
- data/_backups/.

Se quiser versionar uma campanha pública de exemplo no Obsidian, crie uma pasta separada e sem segredos.
