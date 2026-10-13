---
sidebar_position: 5
---

# Backend

El backend vive en `packages/server`. Es un conjunto de microservicios de Linebridge orquestados por el gateway (ver [Core del servicio](./core)).

## Configuración

Copia el archivo de entorno de ejemplo y rellena tus valores:

```shell
cp packages/server/.env-example packages/server/.env
```

`JWT_SECRET` y `MFA_ENCRYPTION_KEY` son lo mínimo necesario para arrancar. Consulta [Configuración](./configuration) para saber dónde vive la configuración y cómo gestionar secretos con Infisical, y [Variables de entorno](./environment) para la referencia completa.

## Servicios

Cada servicio en `packages/server/services` se enlaza a su propio puerto y es proxeado por el gateway:

| Puerto | Servicio      |
| :----- | :------------ |
| 3000   | main          |
| 3001   | posts         |
| 3002   | files         |
| 3003   | music         |
| 3004   | chats         |
| 3005   | marketplace   |
| 3007   | ems (correo)  |
| 3008   | users         |
| 3009   | notifications |
| 3010   | search        |
| 3011   | rtc           |
| 3012   | groups        |
| 3020   | auth          |

## Primer setup

Asegúrate de que la [infraestructura](./core#infraestructura-de-datos) está en marcha y luego inicializa las bases de datos (crea el usuario root y los límites por defecto):

```shell
pnpm run setup:server
```

Para forzar que las tareas se ejecuten de nuevo:

```shell
pnpm run setup:server -- --force
```

## Ejecución

Arranca el gateway junto con todos los servicios (recarga en caliente):

```shell
pnpm run dev:server
```

La API se expone en `http://localhost:9000`. Para ejecutar el backend y la aplicación web a la vez, usa `pnpm run dev` desde la raíz del repositorio.

## Tests y comprobaciones

```shell
pnpm --filter @comty/server test
pnpm --filter @comty/server typecheck
```
