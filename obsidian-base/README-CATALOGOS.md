# Obsidian Hexmaps — versão com Catálogos em Markdown

Esta versão muda a fonte oficial das opções para dentro do Obsidian.

Agora você NÃO precisa editar `hex-config.json` enquanto estiver preparando a campanha.

## Ideia principal

```text
Catalogos/*.md = fonte oficial no Obsidian
Hexes/*.md = usam links para os catálogos
JSON = fica para exportação futura
```

Exemplo:

```yaml
terreno: "[[Pradaria]]"
perigo: "[[Seguro]]"
exploracao: "[[Explorado]]"
poi_tipo: "[[Vilarejo]]"
```

## Pastas importantes

```text
Catalogos/
  Terrenos/
  Perigos/
  Exploracoes/
  Pontos de Interesse/
  Conexoes/
  Estados de POI/
  Controles de Faccao/
  Relacoes de Faccao/

Campanhas/
  Vale dos Sinos/
    _campaign.md
    Hexes/
      A3.md
      B3.md

Templates/
  Novo Hex.md
  Editar Hex Atual.md
  Novo Terreno.md
  Novo Perigo.md
  Nova Exploracao.md
  Novo Ponto de Interesse.md
  Nova Conexao.md
```

## Como testar

1. Abra este vault no Obsidian.
2. Instale/ative os plugins:
   - Templater
   - Metadata Menu
3. Confira:
   - `Settings > Templater > Template folder location = Templates`
   - `Settings > Metadata Menu > class Files Path = Classes/`

## Criar terreno novo

Use:

```text
Ctrl + P
Templater: Create new note from template
Novo Terreno.md
```

Ele cria algo como:

```text
Catalogos/Terrenos/Cerrado.md
```

Depois disso, `Cerrado` aparece no template de criação/edição de hex porque o Templater lê a pasta `Catalogos/Terrenos`.

## Criar hex novo

Use:

```text
Ctrl + P
Templater: Create new note from template
Novo Hex.md
```

Ele vai perguntar a campanha, o hex e os campos principais usando as notas dos catálogos.

## Editar hex existente sem digitar errado

Abra o hex, por exemplo:

```text
Campanhas/Vale dos Sinos/Hexes/A3.md
```

Depois rode:

```text
Ctrl + P
Templater: Insert template
Editar Hex Atual.md
```

Esse template abre listas válidas e atualiza o frontmatter do arquivo atual.

## Observação sobre Metadata Menu

O Metadata Menu continua útil para ver/editar propriedades, mas nesta versão a parte mais segura é o Templater:

- `Novo Hex.md` para criar;
- `Editar Hex Atual.md` para alterar escolhas críticas;
- templates de catálogo para criar novas opções.

Assim você não depende de manter uma lista duplicada dentro do Metadata Menu.

## Exportador

O exportador ficou propositalmente fora desta etapa.

A próxima etapa será fazer o exportador ler:

```text
Catalogos/Terrenos/*.md
Catalogos/Perigos/*.md
Catalogos/Pontos de Interesse/*.md
...
```

e gerar automaticamente:

```text
hex-config.json
hexes-public.json
campaigns.json
```
