# Termux - servir o Hex Viewer localmente

Instale o básico:

```bash
pkg update
pkg install python git
```

Dentro da pasta do repo:

```bash
bash termux/servir_site.sh 8080
```

Para jogadores, use um perfil exportado para uma pasta separada, por exemplo:

```text
data-jogadores/
data-mestre/
```

O `script.js` deste pacote aceita escolher a pasta de dados pela URL:

```text
http://IP-DO-CELULAR:8080/?data=data-jogadores
http://IP-DO-CELULAR:8080/?data=data-mestre
```

No exportador Python, escolha como destino a pasta correspondente:

```text
.../Hex-Viewer/data-jogadores
.../Hex-Viewer/data-mestre
```

Ele grava automaticamente os caminhos no `campaigns.json` como `./data-jogadores/...` ou `./data-mestre/...`.
