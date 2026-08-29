# Termux - Hex Viewer

## Rodar

```bash
cd ~/Hex-Viewer
bash termux/servir_site.sh
```

O script mostra:

```text
Seu link de mestre:
http://IP-DO-CELULAR:PORTA/?data=data-mestre

Link para passar aos jogadores:
http://IP-DO-CELULAR:PORTA/?data=data-jogadores
```

## Porta ocupada

Se aparecer erro parecido com:

```text
OSError: [Errno 98] Address already in use
```

significa que a porta já estava ocupada.

Nesta versão, o script tenta resolver sozinho: se `8080` estiver ocupada, ele usa `8081`, depois `8082`, e assim por diante.

## Forçar porta

```bash
HEX_PORT=8081 bash termux/servir_site.sh
```

## Forçar só o IP impresso

Isso não muda o IP real do celular. Só muda o texto mostrado pelo script.

```bash
HEX_HOST_IP=192.168.0.50 bash termux/servir_site.sh
```

## Parar servidor antigo manualmente

```bash
pkill -f "python.*http.server"
```

Depois rode de novo:

```bash
bash termux/servir_site.sh
```
