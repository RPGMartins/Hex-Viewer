# Painel Hex Viewer

Este painel é para você não esquecer o fluxo depois de algumas semanas.

## Fluxo normal

1. Criar/editar campanha e hexes no Obsidian.
2. Criar hexes vazios se o mapa for grande.
3. Abrir exportador.
4. Selecionar perfil.
5. Marcar opções.
6. Exportar.
7. Commit/push.
8. No Termux: `git pull` e rodar o servidor.

## Ações pelo Templater

Abra uma nota temporária, clique no corpo dela, aperte `Ctrl + P` e rode:

```text
Templater: Open Insert Template modal
```

Depois escolha uma destas ações:

```text
Gerar Hexes Vazios
Abrir Exportador Hex Viewer
Rodar Gerador Python de Hexes Vazios
```

## Regra automática de exportação

Quando você abre o exportador pelo Obsidian ou pelo `tools/executar.bat`, ele usa destino automático:

```text
perfil jogadores → data-jogadores/
perfil mestre    → data-mestre/
outros perfis    → data-<nome-do-perfil>/
```

Assim você não precisa lembrar de trocar a pasta de saída.

## Links no Termux

Mestre no celular:

```text
http://127.0.0.1:8080/?data=data-mestre
```

Jogadores na mesma rede:

```text
http://IP-DO-CELULAR:8080/?data=data-jogadores
```

## Commit básico

Na raiz do repo:

```bash
git status
git add .
git commit -m "atualiza campanha"
git push
```
