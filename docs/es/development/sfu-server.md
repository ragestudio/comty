---
sidebar_position: 7
---

# Servidor SFU

El servidor SFU vive en `packages/sfu-node`. Es una unidad de reenvío selectivo (SFU) basada en [mediasoup](https://mediasoup.org/) que da soporte a los canales de voz y vídeo de Spaces. Es **opcional**: solo se necesita si quieres audio/vídeo en tiempo real.

## Requisitos

- Node.js >= 24 y pnpm.
- Un servidor NATS accesible. El servicio termina si no se define `NATS_ADDRESS`.
- Herramientas de compilación y Python para compilar el módulo nativo de mediasoup.
- Una IP pública accesible por los clientes. El nodo resuelve su propia IP pública vía DNS (`o-o.myaddr.l.google.com`) y la anuncia a los clientes.

## Configuración

El servidor lee una sola variable:

| Variable       | Descripción                                       |
| :------------- | :------------------------------------------------ |
| `NATS_ADDRESS` | Dirección de NATS, p. ej. `nats://localhost:4222` |

## Ejecución

```shell
cd packages/sfu-node
pnpm run build
NATS_ADDRESS=nats://localhost:4222 pnpm start
```

Una vez en línea, el nodo se registra en el bucket KV `sfu_nodes` de NATS y escucha mensajes de control en `sfu:control` y `sfu:ipc:<node_id>`.

## Red

Los transportes de medios escuchan en el **puerto 40001 tanto por TCP como por UDP**. Abre ese puerto para el tráfico entrante en tu firewall/router y asegúrate de que la IP pública anunciada es accesible por los clientes.

## Docker

Hay una imagen lista para usar en `packages/sfu-node/Dockerfile` y está enlazada en `docker/compose.yml`, donde recibe `NATS_ADDRESS=nats:4222`.
