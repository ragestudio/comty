---
sidebar_position: 1
title: Getting Started
slug: /
---

# Primeros pasos

Comty es un **monorepo de workspaces de pnpm** que agrupa toda la plataforma: el backend en tiempo real, el cliente web, los clientes de escritorio y móvil, y el servidor SFU de medios opcional.

Esta guía cubre los requisitos y cómo preparar el entorno de desarrollo. Desde aquí puedes saltar a la parte concreta que quieras ejecutar.

## Estructura del repositorio

| Ruta | Descripción |
| :-- | :-- |
| `packages/server` | Backend. Microservicios de Linebridge ejecutados por el gateway |
| `packages/app` | Aplicación web (React + Vite) |
| `packages/desktop` | Cliente de escritorio (Electron) |
| `packages/native` | Cliente móvil |
| `packages/sfu-node` | SFU opcional (mediasoup) para voz/vídeo |
| `packages/shared` | Tipos, clases y utilidades compartidas |
| `modules/linebridge` | Framework Linebridge (submódulo de git) |
| `docs` | Fuentes de la documentación (Docusaurus) |
| `docker` | Stack de compose para producción |

## Requisitos

> Recomendamos encarecidamente **Linux o macOS**. En Windows usa [WSL2](https://learn.microsoft.com/es-es/windows/wsl/). No se soportan los sistemas basados en Alpine (musl), el backend enlaza contra **glibc**.

| Requisito | Versión | Notas |
| :-- | :-- | :-- |
| Node.js | >= 24 | Requerido por Linebridge y el SFU |
| pnpm | >= 11 | Gestor de paquetes obligatorio (no se soportan npm ni yarn) |
| Python | >= 3.10 | Compilación de módulos nativos (`node-gyp`) |
| Toolchain C/C++ | - | `build-essential` en Debian/Ubuntu, Xcode CLT en macOS |
| FFmpeg / FFprobe | >= 6 | Procesado de medios del servidor |
| Ultragateway | latest | Binario del gateway, se instala solo la primera vez que se ejecuta |
| Docker | opcional | Infraestructura de datos y despliegue en producción |

## Activar pnpm

Comty requiere **pnpm**. Node incluye [corepack](https://nodejs.org/api/corepack.html), así que la forma más sencilla es:

```shell
corepack enable
corepack prepare pnpm@11.3.0 --activate
```

O instálalo siguiendo las [instrucciones oficiales](https://pnpm.io/installation). La versión está fijada mediante el campo `packageManager` del `package.json` raíz, por lo que corepack la usará automáticamente.

Verifica la instalación:

```shell
pnpm -v
```

## Obtener los archivos

```shell
git clone --recurse-submodules https://github.com/ragestudio/comty && cd comty
```

Si ya lo clonaste sin submódulos:

```shell
git submodule update --init --recursive
```

## Instalar dependencias

```shell
pnpm install
```

Esto instala todos los paquetes del workspace. No uses `npm install`.

## Binarios externos

El backend depende de un binario de gateway y de FFmpeg. En Linux puedes instalarlos en todo el sistema:

```shell
sudo bash packages/server/scripts/externalDeps.sh
```

O individualmente:

```shell
sudo bash packages/server/scripts/installUltragateway.sh
sudo bash packages/server/scripts/installFfmpeg.sh
```

El gateway también se descarga bajo demanda la primera vez que lo arrancas desde la CLI de Linebridge.

## Siguientes pasos

- [Configuración](./configuration) — dónde vive la configuración y gestión de secretos
- [Variables de entorno](./environment) — referencia completa
- [Core del servicio](./core) — gateway e infraestructura de datos
- [Backend](./backend) — servicios, entorno y primer setup
- [Aplicación web](./web-app) — frontend
- [Servidor SFU](./sfu-server) — servidor de medios opcional para voz/vídeo
- [Despliegue](./deployment) — producción
