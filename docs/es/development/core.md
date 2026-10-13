---
sidebar_position: 4
---

# Core del servicio

El **core** de Comty es el proceso gateway (`ultragateway`) junto con la infraestructura de datos compartida. El gateway sirve el tráfico HTTP/WebSocket y orquesta todos los microservicios del backend: los arranca, los vigila y los reinicia.

## Cómo funciona

- `packages/server/gateway.config.json` define el gateway: `mode`, puerto HTTP (`9000`), socket IPC, conexión a Redis, rutas personalizadas y plugins/scripts.
- Al arrancar, el gateway escanea `packages/server/services/**/*.service.{js,ts}` y arranca cada servicio con el bootloader de Linebridge.
- Los servicios registran sus rutas HTTP y eventos WebSocket ante el gateway a través de un socket unix (IPC) y usan NATS para la mensajería entre servicios y en tiempo real.
- En `mode: "dev"` el gateway vigila los archivos de los servicios y los recarga en caliente al cambiar.

## Infraestructura de datos

El backend necesita los siguientes servicios:

| Servicio | Puerto por defecto | Para qué |
| :-- | :-- | :-- |
| MongoDB | 27017 | Documentos principales (usuarios, posts, archivos, ...) |
| ScyllaDB | 9042 | Mensajes de chats/spaces (`scylla-odm`) |
| Redis / Dragonfly | 6379 | Caché, colas y estado del gateway |
| NATS (JetStream) | 4222 | Mensajería entre servicios y registro del SFU |
| S3 (SeaweedFS) | 8333 | Almacenamiento de archivos/objetos |

NATS viene embebido en el gateway (los datos se guardan en `packages/server/nats-data`) salvo que se configure un servidor externo. Redis se configura a través de `gateway.config.json`.

### Ejecutar la infraestructura con Docker

El repositorio incluye un stack de desarrollo listo para usar en `docker-dev/compose.yml`. Levanta MongoDB, ScyllaDB, Redis (Dragonfly), NATS y SeaweedFS (almacenamiento compatible con S3) con sus puertos publicados en localhost:

```shell
docker compose -f docker-dev/compose.yml up -d
```

Para levantar además el nodo SFU opcional (voz/vídeo de Spaces):

```shell
docker compose -f docker-dev/compose.yml --profile sfu up -d
```

Detenlo con `docker compose -f docker-dev/compose.yml down` (añade `-v` para eliminar también los volúmenes de datos).

> ScyllaDB consume bastante memoria. El stack de desarrollo ejecuta ScyllaDB con recursos reducidos (`--smp 1 --memory 1G`); ajusta el comando del servicio `scylla` en el compose si quieres darle más.

Si quieres que el gateway y los servicios (y el SFU) compartan el NATS del stack en lugar del embebido, define `NATS_URL=nats://localhost:4222`.

## Binario del gateway

El binario del gateway (`ultragateway`) es necesario para ejecutar el backend. El comando `linebridge gateway` ofrecerá instalarlo automáticamente si no está presente. Para instalarlo en todo el sistema de antemano:

```shell
sudo bash packages/server/scripts/installUltragateway.sh
```

A continuación, continúa con la guía del [Backend](./backend) para configurar el entorno, ejecutar el primer setup y arrancar el gateway junto con los servicios.
