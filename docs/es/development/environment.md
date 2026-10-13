---
sidebar_position: 3
---

# Variables de entorno

Referencia completa de las variables que reconoce cada componente. Solo un subconjunto es necesario para arrancar; el resto habilitan funciones concretas. Consulta [Configuración](./configuration) para saber de dónde se cargan.

## Gateway

| Variable | Descripción |
| :-- | :-- |
| `NODE_ENV` | `production` o `development` |
| `DEBUG` | Activa el log de depuración del gateway |
| `NATS_URL` | Dirección de NATS externo (p. ej. `nats://localhost:4222`); si no se define, el gateway arranca un NATS embebido |
| `JWT_SECRET` | Secreto de firma de tokens usado por el gateway |
| `LINEBRIDGE_PLUGINS` | Lista de plugins de Linebridge a cargar, separados por comas |
| `LINEBRIDGE_PLUGINS_PATH` | Directorio de plugins personalizado |
| `LB_GATEWAY_SOCKET` | Ruta del socket IPC del gateway (lo define el gateway para cada servicio) |
| `LB_SOCKET_MODE` | Los servicios escuchan en sockets unix en lugar de TCP (lo define el gateway) |
| `GRACEFUL_SHUTDOWN_TIMEOUT` | Segundos de espera antes de un apagado forzado |
| `AUTO_SHUTDOWN_WHEN_IDLE` | Apaga la instancia cuando no hay clientes conectados |

### Infisical

| Variable                  | Descripción                        |
| :------------------------ | :--------------------------------- |
| `INFISICAL_CLIENT_ID`     | Client id de universal auth        |
| `INFISICAL_CLIENT_SECRET` | Client secret de universal auth    |
| `INFISICAL_PROJECT_ID`    | Proyecto destino                   |
| `INFISICAL_PATH`          | Ruta de secretos (por defecto `/`) |

## Servicios del backend

### Auth

| Variable | Descripción |
| :-- | :-- |
| `JWT_SECRET` | Secreto de firma |
| `JWT_ALGORITHM` | Algoritmo JWT (por defecto `ES256`) |
| `JWT_KID` | Key id anunciado en la cabecera del token y en el JWKS |
| `JWT_EXPIRES_IN` | Vida del token de acceso (por defecto `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | Vida del refresh token (por defecto `30d`) |
| `ECDSA_PRIVATE_KEY` / `ECDSA_PUBLIC_KEY` | Claves PEM para firmar (o `ECDSA_PRIVATE_KEY_B64` / `ECDSA_PUBLIC_KEY_B64` en base64) |
| `MFA_ENCRYPTION_KEY` | Clave de cifrado del MFA, mínimo 32 caracteres |
| `BCRYPT_ROUNDS` | Factor de coste de bcrypt para las contraseñas |
| `OIDC_ISSUER_URL` | URL del emisor usada por los endpoints OIDC |
| `TURNSTILE_SECRET` / `TURNSTILE_SITEKEY` | Claves de Cloudflare Turnstile |

### Bases de datos

MongoDB:

| Variable             | Descripción                    |
| :------------------- | :----------------------------- |
| `DB_HOSTNAME`        | Hostname                       |
| `DB_PORT`            | Puerto (por defecto `27017`)   |
| `DB_NAME`            | Nombre de la base de datos     |
| `DB_USER` / `DB_PWD` | Credenciales                   |
| `DB_DRIVER`          | Driver (por defecto `mongodb`) |
| `DB_AUTH_SOURCE`     | Base de datos de autenticación |

ScyllaDB:

| Variable | Descripción |
| :-- | :-- |
| `SCYLLA_CONTACT_POINTS` | Contact points separados por comas (por defecto `127.0.0.1`) |
| `SCYLLA_LOCAL_DATA_CENTER` | Data center local (por defecto `datacenter1`) |
| `SCYLLA_KEYSPACE` | Keyspace (por defecto `default_keyspace`) |

Redis:

| Variable                            | Descripción                        |
| :---------------------------------- | :--------------------------------- |
| `REDIS_HOST`                        | Hostname (por defecto `localhost`) |
| `REDIS_PORT`                        | Puerto (por defecto `6379`)        |
| `REDIS_AUTH`                        | Cadena `usuario:contraseña`        |
| `REDIS_USERNAME` / `REDIS_PASSWORD` | Credenciales                       |
| `REDIS_NO_AUTH`                     | Desactiva la autenticación         |
| `REDIS_DB`                          | Índice de base de datos            |

### Almacenamiento

S3 estándar (`S3_*`) y, opcionalmente, Backblaze B2 (`B2_*`) u OVH (`OVH_S3_*`). El servicio de archivos registra los proveedores adicionales cuando sus credenciales están presentes.

El stack `docker-dev` incluye un endpoint compatible con S3 (SeaweedFS) para desarrollo local. Apunta `S3_ENDPOINT=127.0.0.1`, `S3_PORT=8333`, `S3_USE_SSL=false`, `S3_REGION=us-east-1`, `S3_BUCKET=comty` y credenciales de relleno (`S3_ACCESS_KEY` / `S3_SECRET_KEY`).

| Variable                                           | Descripción            |
| :------------------------------------------------- | :--------------------- |
| `S3_ENDPOINT` / `S3_PORT` / `S3_USE_SSL`           | Conexión               |
| `S3_REGION`                                        | Región                 |
| `S3_BUCKET`                                        | Bucket por defecto     |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY`                  | Credenciales           |
| `B2_ENDPOINT` / `B2_CDN_ENDPOINT`                  | Endpoint y CDN         |
| `B2_KEY_ID` / `B2_APP_KEY`                         | Credenciales           |
| `B2_BUCKET` / `B2_BUCKET_ID` / `B2_KEY_NAME`       | Información del bucket |
| `OVH_S3_ENDPOINT` / `OVH_S3_CDN` / `OVH_S3_BUCKET` | Conexión               |
| `OVH_S3_KEY_ID` / `OVH_S3_SECRET_KEY`              | Credenciales           |

### Correo (EMS)

| Variable        | Descripción                            |
| :-------------- | :------------------------------------- |
| `SMTP_HOSTNAME` | Host SMTP                              |
| `SMTP_PORT`     | Puerto (por defecto `587`)             |
| `SMTP_USERNAME` | Usuario y dirección `from` por defecto |
| `SMTP_PASSWORD` | Contraseña                             |
| `SMTP_SECURE`   | Usar TLS                               |

### RTC

| Variable | Descripción |
| :-- | :-- |
| `MEDIASOUP_ANNOUNCED_IP` | IP pública anunciada por mediasoup |
| `TURN_SERVER_URL` / `TURN_SERVER_TCP_URL` | URLs de TURN (UDP / TCP) |
| `TURN_SERVER_USERNAME` / `TURN_SERVER_PASSWORD` | Credenciales de TURN |

## Servidor SFU

| Variable       | Descripción                                              |
| :------------- | :------------------------------------------------------- |
| `NATS_ADDRESS` | Dirección de NATS a la que se conecta el SFU (requerida) |

## Integraciones

| Variable | Descripción |
| :-- | :-- |
| `APP_URL` | URL pública de la aplicación web, usada para construir enlaces de compartir |
| `GITHUB_REPO` | `owner/repo` usado por los endpoints de repositorio |
| `NFC_TAG_ENDPOINT` | Endpoint base para las etiquetas NFC |
| `KLIPY_TOKEN` | Token de la API de Klipy |

## Aplicación web

| Variable                 | Descripción                      |
| :----------------------- | :------------------------------- |
| `VITE_SENTRY_DSN`        | DSN de Sentry (producción)       |
| `VITE_TURNSTILE_SITEKEY` | Site key de Cloudflare Turnstile |
