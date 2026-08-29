# Hex Viewer

Repo pensado para guardar:

- o site do Hex Viewer;
- a base do Obsidian com catálogos, templates e a campanha modelo `Vale dos Sinos`;
- o exportador em Python;
- dados exportados para uso local, se o repo for privado.

## Estrutura sugerida

```text
/
  index.html
  styles.css
  script.js
  js/
  images/

  data/              # dados padrão do site
  data-jogadores/    # opcional: perfil público dos jogadores
  data-mestre/       # opcional: perfil do mestre/local

  obsidian-base/
    Templates/
    Classes/
    Catalogos/
    Campanhas/
      Vale dos Sinos/   # campanha modelo

  tools/
    hex_export_tool.py
    executar.bat
    gerar_exe_windows.bat

  termux/
    servir_site.sh
```

## Fluxo normal

1. Edite/crie catálogos e hexes no Obsidian.
2. Abra `tools/hex_export_tool.py`.
3. Escolha o vault/pasta `obsidian-base` ou seu vault real.
4. Crie/edite um perfil de exportação.
5. Exporte para `data/`, `data-jogadores/` ou `data-mestre/`.
6. Rode o site localmente ou pelo Termux.

## Múltiplas pastas de dados

O `script.js` aceita escolher o manifesto pela URL:

```text
/?data=data
/?data=data-jogadores
/?data=data-mestre
```

Também aceita caminho direto:

```text
/?manifest=./data-jogadores/campaigns.json
```

Isso permite manter o mesmo site e trocar apenas o conjunto de dados.

## Termux

Para servir no celular:

```bash
bash termux/servir_site.sh 8080
```

Depois abra no navegador:

```text
http://IP-DO-CELULAR:8080/?data=data-jogadores
```

## Observação

Se este repo estiver privado, você pode usar como backup completo. Se em algum momento ele voltar a ser público, revise `data/`, `data-mestre/`, campanhas privadas e notas do Obsidian antes de publicar.
