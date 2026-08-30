# Termux - Hex Viewer

## Rodar

```bash
cd ~/Hex-Viewer
bash termux/servir_site.sh
```

## Links

Para o mestre no próprio celular, use sempre:

```text
http://127.0.0.1:8080/?data=data-mestre
```

Para jogadores na mesma rede Wi-Fi:

```text
http://IP-DO-CELULAR:8080/?data=data-jogadores
```

## Por que usar 127.0.0.1 para o mestre?

O `localStorage` do navegador depende de protocolo + endereço + porta.

Então estes endereços têm localStorage diferente:

```text
http://127.0.0.1:8080
http://192.168.10.106:8080
http://192.168.10.106:8081
```

Use sempre `127.0.0.1:8080` no celular do mestre para não perder preferências.

## Porta ocupada

O script atual mata servidores antigos de `python -m http.server` antes de iniciar.
Isso evita cair em `8081`, `8082`, etc.

Parar manualmente:

```bash
pkill -f "python.*http.server"
```

## Usar outra porta fixa

```bash
HEX_PORT=8081 bash termux/servir_site.sh
```

## Não matar servidores antigos

```bash
HEX_KILL_OLD=0 bash termux/servir_site.sh
```
