---
name: linebridge
description: Understand the Linebridge server framework fully — its architecture, engines, routing, WebSockets, NATS federation, plugins, request/response lifecycle, and all core APIs. Use this skill when working with or debugging any Linebridge-based backend service.
---

# Linebridge Framework — Complete Reference

Linebridge is a multiproposal, TypeScript-first server framework built on uWebSockets.js via the "neo" engine. It provides HTTP, WebSocket, SSE, and NATS-based distributed messaging with filesystem-based routing, middleware composition, context injection, and plugin architecture.

**Requirements**: Node.js >= 24, Linux/macOS (Windows via WSL), GLibc (no musl/Alpine).

## Source Layout

```
modules/linebridge/server/
├── src/                      # Framework source
│   ├── index.ts              # Public API exports
│   ├── server.ts             # Server class (core)
│   ├── types.ts              # Core TypeScript types
│   ├── vars.ts               # Defaults, metadata, constants
│   ├── global.ts             # Global injection (OperationError, defineRoute)
│   ├── engines/neo/          # uWebSockets.js engine implementation
│   │   ├── index.ts          # Engine class (SSL, WS attach, route reg)
│   │   ├── request.ts        # NeoRequest (wraps uWS HttpRequest)
│   │   ├── response.ts       # NeoResponse (wraps uWS HttpResponse)
│   │   ├── route_register.ts # Route registration on uWS
│   │   ├── register_middleware.ts
│   │   ├── on_request.ts     # Incoming request handler
│   │   ├── request_iterator.ts # Middleware/handler execution loop
│   │   ├── listen.ts / close.ts
│   │   ├── SSEventStream.ts  # Server-Sent Events
│   │   ├── LiveFile.js       # Auto-reloading file reader
│   │   ├── MultipartField.js # Multipart form data handling
│   │   └── ws/               # WebSocket polyfill for uWS
│   ├── classes/
│   │   ├── Route/            # Route class + defineRoute helper
│   │   ├── Handler/          # Unified handler wrapper (http/ws/middleware)
│   │   ├── EngineAdaptor/    # Abstract engine interface
│   │   ├── RtEngine/         # Real-Time Engine (WebSocket subsystem)
│   │   ├── Nats/             # NATS adapter, client proxy, serializers
│   │   ├── IPC/              # Inter-process communication client
│   │   └── OperationError/   # HTTP-aware error class
│   ├── registers/            # Boot-phase registration modules
│   │   ├── httpFileRoutes.ts    # Scan routes/ dir for route files
│   │   ├── websocketFileEvents.ts # Scan ws_routes/ for WS event files
│   │   ├── baseRoutes.ts     # / and /_map built-in routes
│   │   ├── baseHeaders.ts    # server + lb-version headers
│   │   ├── baseMiddlewares.ts # Global middleware resolution
│   │   ├── gateway.ts        # Service registration with gateway
│   │   ├── plugins.ts        # Plugin loading from LINEBRIDGE_PLUGINS env
│   │   └── bypassCorsHeaders.ts
│   ├── middlewares/
│   │   ├── cors/             # CORS preflight handler
│   │   └── logger/           # Request logging middleware
│   └── utils/                # composeMiddlewares, parsePathParameters, etc.
├── bootloader/               # CLI entry point (linebridge-boot)
│   ├── boot.js               # Main: dotenv, sucrase, aliases, run main
│   ├── boot_function.js      # Boot(mainClass) global
│   ├── globals.js            # nanoid, ToBoolean, b64Encode/Decode
│   └── libs/                 # watcher, aliases, infisical
├── example/                  # Example API server
└── package.json              # v2.0.0-alpha18
```

---

## Architecture & Lifecycle

```
Boot(MyAPI)
  └─ bootloader/boot.js
       ├─ dotenv (.env)
       ├─ sucrase/register (JIT transpilation)
       ├─ module aliases (@, @routes, @classes, etc.)
       ├─ globals (nanoid, ToBoolean, b64Encode/Decode, isProduction)
       └─ new MyAPI().run()

Server.run()
  1. getHostAddress() → localAddress
  2. Wire events → eventBus (tseep)
  3. If LB_GATEWAY_SOCKET → NatsAdapter + IPC
  4. Load engine (Engines[params.useEngine]) → engine.initialize()
  5. Execute this.initialize[] tasks (parallel)
  6. onInitialize() hook
  7. registerBaseHeaders() + registerBaseMiddlewares()
  8. Register class-based WS events (this.wsEvents)
  9. Register class-based HTTP routes (this.routes)
  10. registerHttpFileRoutes(routesPath)
  11. registerWebsocketsFileEvents(wsRoutesPath)
  12. registerBaseRoutes() — / and /_map
  13. registerGateway() — if LB_GATEWAY_SOCKET
  14. registerPlugins() — LINEBRIDGE_PLUGINS env
  15. engine.listen()
  16. afterInitialize() hook
  17. Print startup summary
```

---

## Server Class (`server.ts`)

```ts
export class Server<EngineType = "neo"> {
  // Static overrides (take precedence over defaults)
  static refName?: string
  static useEngine?: string
  static listenIp?: string
  static listenPort?: string | number
  static websockets?: boolean | { enabled: boolean; path?: string }
  static baseRoutes?: boolean
  static routesPath?: string
  static wsRoutesPath?: string
  static useMiddlewares?: Array<string | MiddlewareHandlerFunction>

  // Instance state
  params: ServerParams
  eventBus = new EventEmitter()   // tseep
  engine!: EngineAdaptor
  nats: NatsAdapter | null        // gateway mode only
  ipc: IPC | null                 // gateway mode only
  plugins: Map<string, ServerPlugin>
  localAddress: string
  ssl: { key: string; cert: string }
  headers: Record<string, string>
  base_contexts = { server: this }
  base_middlewares = { logs: LoggerMiddleware, cors: CorsMiddleware }

  // User overrides (define on subclass)
  contexts!: Record<string, any>
  middlewares!: Record<string, MiddlewareHandlerFunction>
  routes!: Record<string, RouteObject>
  wsEvents?: Record<string, WebsocketHandlerFunction>
  ipcEvents?: IPCEvents
  events: Record<string, Function>
  initialize?: Array<() => Promise<void>>  // parallel init tasks

  // Lifecycle hooks (override on subclass)
  onInitialize?(): Promise<void>       // before routes, after engine init
  afterInitialize?(): Promise<void>    // after engine.listen()
  onClose?(): void                     // cleanup on shutdown

  // WS hooks
  handleWsUpgrade?: (context: any, token: string, res: any) => Promise<void>
  handleWsConnection?: (socket: any) => Promise<void>
  handleWsDisconnect?: (socket: any, client?: any) => Promise<void>

  // Computed: experimental (isExperimental()), hasSSL (ssl.key + ssl.cert)
  // Methods: run(), _fireClose()
  // Dynamic: register.http(route), register.ws(route) — experimental
}
```

**ServerParams** (defaults from `Vars.defaultParams`):

| Param | Default | Description |
|-------|---------|-------------|
| `refName` | `"linebridge"` | Service name, NATS prefix, gateway namespace |
| `listenIp` | `"0.0.0.0"` | Bind IP |
| `listenPort` | `LB_PORT` env or `3000` | Bind port |
| `useEngine` | `"neo"` | Engine registry key |
| `websockets` | `false` | `boolean \| { enabled, path? }` |
| `nats` | `null` | `{ address?, port? }` |
| `baseRoutes` | `true` | Register `/` and `/_map` |
| `routesPath` | `cwd/routes` | File-based HTTP route dir |
| `wsRoutesPath` | `cwd/ws_routes` | File-based WS event dir |
| `useMiddlewares` | `[]` | Global middleware names or fns |
| `httpMethods` | `[get,post,put,patch,del,delete,trace,head,any,options,ws]` | Recognized methods |

---

## Routing — Three Ways

### 1. File-Based Routes (recommended)

Files in `routes/` directory. Filename = HTTP method, directory path = URL. Automatically discovered at boot.

```
routes/users/[id]/get.ts     → GET  /users/:id
routes/users/[id]/post.ts    → POST /users/:id
routes/users/index/get.ts    → GET  /users
routes/users/[$]/get.ts      → GET  /users/*  (catch-all)
routes/users/*/get.ts        → GET  /users/*  (alternative)
```

- `[paramName]` → `:paramName` (path parameter)
- `[$]` or `*` → `*` (wildcard/catch-all)
- `index.*` maps to parent directory
- File must export a default function OR an object with `{ fn, useMiddlewares?, useContexts? }`

```ts
// routes/users/[id]/get.ts
import API from "@/index"

export default defineRoute<API>()({
  useMiddlewares: ["auth"],
  useContexts: ["db", "server"] as const,
  fn: async (req, res, ctx) => {
    const userId = req.params.id
    return ctx.db.findUser(userId)
  },
})
```

### 2. Class-Based Routes (`this.routes`)

```ts
export default class API extends Server {
  routes = {
    "/hi": defineRoute<API>()({
      method: "get",
      fn: async () => ({ hello: "world" }),
    }),
    "/sum/:a/:b": defineRoute<API>()({
      method: "get",
      fn: async (req, res) => ({
        result: +req.params.a + +req.params.b,
      }),
    }),
    "/events": defineRoute<API>()({
      method: "get",
      fn: (req, res) => {
        const stream = res.sse
        if (!stream) return
        stream.open()
        setInterval(() => { if (stream.active) stream.send("ping") }, 1000)
      },
    }),
  }
}
```

### 3. Programmatic Routes

```ts
class CustomRoute extends Route<API> {
  path = "/custom"
  method = "post"
  useMiddlewares = ["auth"]
  handler = async (req, res) => { /* ... */ }
}

// In onInitialize():
this.engine.register(CustomRoute)           // register class constructor
// OR
this.engine.register(new CustomRoute())     // register instance
```

### HTTP Methods

`"any"` | `"get"` | `"post"` | `"put"` | `"delete"` | `"patch"` | `"options"` | `"head"`

`"delete"` is normalized to `"del"` for uWS compatibility. `"any"` creates a catch-all.

---

## `defineRoute()` — Type-Safe Route Helper

Provides: engine-specific `req`/`res` types, autocompletion for `useMiddlewares`/`useContexts`, narrowed `ctx` type.

```ts
defineRoute<MyAPI>()({
  method: "get",
  useMiddlewares: ["logs"],          // autocompleted
  useContexts: ["server"] as const,  // as const for literal types
  fn: (req, res, ctx) => {
    // req: NeoRequest<MyAPI> — full engine API (sse, sign, cookie, locals...)
    // res: NeoResponse<MyAPI> — full engine API
    // ctx: { server: MyAPI } — only selected contexts
    return ctx.server.params.refName
  },
})
```

**Handler return value**: if non-void and response not sent yet → auto `res.json(result)`.

---

## Request Object (`engines/neo/request.ts`)

Wraps uWS `HttpRequest`. Key API:

| Property/Method | Description |
|-----------------|-------------|
| `req.method` | HTTP method (uppercase) |
| `req.url` | Full URL with query string |
| `req.path` | Path without query string |
| `req.query` | Parsed query params (fast-querystring) |
| `req.params` | Path parameters (e.g. `:id`) |
| `req.body` | Parsed body (after `parseBody()` or explicit parse) |
| `req.headers` | Lowercase header keys |
| `req.cookies` | Parsed Cookie header |
| `req.ip` | Client IP (respects `X-Forwarded-For` if `trust_proxy`) |
| `req.proxy_ip` | Upstream proxy IP |
| `req.ctx` | Request-local context (middlewares attach data here) |
| `req.locals` | Lazy-initialized middleware-to-middleware data |
| `req.raw` | Raw uWS HttpRequest |
| `req.route` | Matched Route instance |
| `req.paused` / `req.received` | Stream state |
| `req.parseBody()` | Auto-detect content-type and parse |
| `req.json(default?)` | Parse as JSON |
| `req.text()` | Body as UTF-8 string |
| `req.urlencoded()` | Parse as URL-encoded |
| `req.buffer()` | Raw Buffer |
| `req.multipart(options?, handler)` | Process multipart via busboy |
| `req.sign(val, secret)` | Sign cookie value (cookie-signature) |
| `req.unsign(val, secret)` | Unsign cookie value |

Request extends `stream.Readable` → `pipe()`, `pause()`, `resume()` available.

---

## Response Object (`engines/neo/response.ts`)

Wraps uWS `HttpResponse`. Key API:

| Property/Method | Description |
|-----------------|-------------|
| `res.completed` | Whether response sent or aborted |
| `res.initiated` / `res.headersSent` | Whether headers were written |
| `res.statusCode` / `res.status(code)` | HTTP status (default 200) |
| `res.statusMessage` | Custom status message |
| `res.json(data)` | Send JSON (`content-type: application/json`) |
| `res.html(data)` | Send HTML |
| `res.send(data?, close?)` | Send response (auto-handles streaming) |
| `res.end(data?)` | Alias for send |
| `res.redirect(url)` | 302 redirect |
| `res.sendStatus(code)` | Status-only response |
| `res.file(path, cb?)` | Send file (LiveFile with auto-reload) |
| `res.download(path, filename?)` | File download with attachment header |
| `res.stream(readable, totalSize?)` | Stream readable to response |
| `res.write(chunk)` | Write chunk (returns boolean for backpressure) |
| `res.drain(handler)` | Backpressure drain handler |
| `res.close()` | Close connection without response |
| `res.header(name, val, overwrite?)` | Set header |
| `res.setHeader(k, v)` | Overwrite header |
| `res.writeHeaders(obj)` | Batch headers |
| `res.getHeader(name)` | Get header |
| `res.removeHeader(name)` | Remove header |
| `res.type(mime)` | Set Content-Type by mime or extension |
| `res.cookie(name, val, expiry?, opts?, sign?)` | Set cookie (auto-signs) |
| `res.setCookie(name, val, opts)` | Set cookie without expiry |
| `res.removeCookie(name)` | Delete cookie (maxAge=0) |
| `res.attachment(path?, name?)` | Content-Disposition: attachment |
| `res.upgrade(context?)` | Upgrade HTTP to WebSocket |
| `res.atomic(fn)` | Batch writes in single uWS cork |
| `res.sse` | SSEventStream (only for GET) |
| `res.locals` | Lazy-initialized middleware-to-middleware data |

**Events**: `"abort"`, `"close"`, `"finish"`.

Response extends `stream.Writable`.

---

## Server-Sent Events (SSE)

Available via `res.sse` on GET requests. Returns `undefined` on non-GET.

```ts
interface SSEventStream {
  open(): boolean                                  // initiate SSE connection
  close(): boolean                                 // close SSE
  comment(data: string): boolean                   // keep-alive comment
  send(id: string, event: string, data: string): boolean
  send(event: string, data: string): boolean
  send(data: string): boolean
  readonly active: boolean                         // false when client disconnects
}
```

Always check `stream.active` before writing in async loops.

---

## Middlewares

Signature: `(req, res, next) => any`. Call `next()` to continue. Don't call `next()` to stop.

```ts
export default class API extends Server {
  middlewares = {
    auth: async (req, res, next) => {
      const token = req.headers["authorization"]
      if (!token) return res.status(401).json({ error: "Unauthorized" })
      req.ctx.user = await validateToken(token)
      next()
    },
  }

  // Global middlewares:
  static useMiddlewares = ["logs", "cors"]

  // Route-specific:
  useMiddlewares: ["auth"]
}
```

**Execution order**: engine-level middlewares first, then route-specific middlewares, then handler. Errors caught by Handler wrapper: `OperationError` → status+message, other → 500.

**Built-in middlewares**: `"logs"` (request logger, disabled in production), `"cors"` (OPTIONS preflight handler).

---

## Contexts

Type-safe dependency injection. Resolved at route init time (once), shared across all requests to that route.

```ts
export default class API extends Server {
  contexts = {
    db: databaseConnection,
    cache: redisClient,
    config: { maxUploadSize: 10 * 1024 * 1024 },
    sum: (a: number, b: number) => a + b,
  }
}

// In route:
useContexts: ["db", "sum"] as const
// ctx = { db: Database, sum: (a,b) => number }
```

**Base contexts** (always available): `{ server: this }`.

**Per-request context**: use `req.ctx` (set by middlewares) for request-scoped data.

---

## WebSockets & RTEngine

Enable: `static websockets = true` or `{ enabled: true, path: "/ws" }` (default path = `/${refName}`).

**Lifecycle**: upgrade → connection → messages → disconnect.

```ts
export default class API extends Server {
  // Upgrade hook — validate token, reject if unauthorized
  async handleWsUpgrade(context: any, token: string, res: any) {
    if (!token) return res.status(401).end()
    const user = await validateToken(token)
    if (!user) return res.status(401).end()
    context.user = user
    res.upgrade(context)
  }

  async handleWsConnection(socket: any) { /* connection opened */ }
  async handleWsDisconnect(socket: any, client?: any) { /* connection closed */ }

  // Event handlers (class-based)
  wsEvents = {
    "chat:message": async (client, data) => {
      await client.toTopic("chat", "chat:message", {
        user: client.userId,
        text: data.text,
      })
    },
    "chat:join": async (client, data) => {
      await client.subscribe("chat")
      await client.emit("chat:joined", { topic: "chat" })
    },
    "chat:leave": async (client, data) => {
      await client.unsubscribe("chat")
    },
  }
}
```

### Client Object (`WsClient` interface)

| Method/Property | Description |
|-----------------|-------------|
| `client.id` | Unique socket identifier |
| `client.userId` / `client.user_id` | User ID (set during upgrade) |
| `client.token` | Auth token |
| `client.user` | User document |
| `client.authenticated` | Has token + user_id |
| `client.emit(event, data?, error?, ack?)` | Send event to this client |
| `client.error(error)` | Send error to this client |
| `client.ack(event, data?, error?)` | Send acknowledgement |
| `client.subscribe(topic)` | Subscribe to MQTT-style topic |
| `client.unsubscribe(topic)` | Unsubscribe from topic |
| `client.toTopic(topic, event, data?, self?)` | Send to all topic subscribers |
| `client.operation(type, data?)` | Send operation request |

**Client message protocol**:
```json
{ "event": "chat:message", "data": { "text": "Hello" }, "ack": true }
```

### File-Based WS Events (`ws_routes/`)

```
ws_routes/chat/message.ts  →  event: "chat:message"
ws_routes/user/typing.ts   →  event: "user:typing"
```

Path `/` replaced by `:`. Files export a handler function or `{ fn, useContexts?, ... }`.

### Finding & Sending to Clients

```ts
// Find by user ID
const clients = server.engine.ws.find.clientsByUserId("user123")

// Send to specific client
server.engine.ws.senders.toClientId("socket-abc", "event", data)

// Send to all clients of a user
server.engine.ws.senders.toUserId("user123", "event", data)

// Send to topic subscribers
server.engine.ws.senders.toTopic("chat", "event", data)
```

### Engine-level pub/sub

```ts
server.engine.publish("topic", JSON.stringify(data))       // publish
server.engine.num_of_subscribers("topic")                  // subscriber count
```

Topics use MQTT syntax: `chat`, `chat/room1`, `chat/+` (single-level), `chat/#` (multi-level).

---

## NATS & Distributed Mode (Gateway)

When `LB_GATEWAY_SOCKET` env var is set, the server enters gateway mode:

1. **NatsAdapter** connects to NATS (`server.nats`)
2. **IPC** client connects to gateway Unix socket (`server.ipc`)
3. Service registers HTTP routes + WS events with gateway
4. All WebSocket operations proxy through NATS for cross-instance communication

### NatsAdapter

```ts
// Global channel pub/sub
await server.nats.subscribeToGlobalChannel("broadcast", (data, msg) => { ... })
await server.nats.unsubscribeFromGlobalChannel("broadcast")

// Cluster operations
server.nats.operations.findClientsByUserId("user123")
server.nats.operations.sendToClientID("socket-abc", "event", data)
server.nats.operations.sendToTopic("topic", "event", data)
server.nats.operations.sendToUserId("user123", "event", data)
```

### IPC Events

```ts
export default class UserService extends Server {
  ipcEvents = {
    "getUser": async (contexts, data) => {
      return await contexts.db.users.findById(data.userId)
    },
  }
}

// From another service:
await server.ipc.invoke("user-service", "getUser", { userId: "123" })
```

### NatsClient (Remote Client Proxy)

When a WebSocket event comes from another gateway instance, a `NatsClient` is synthesized. It has the same API as a local client (`emit`, `subscribe`, `toTopic`) but all operations route through NATS.

### NATS Serializers

Message types use `fast-json-stringify`:
- **EventData**: `{ event, data?, error?, ack? }`
- **Operation**: `{ type, data? }`
- **OpResult**: `{ ok, data?, error? }`

---

## Plugins

Loaded from `lb-plugins/` directory (or `LINEBRIDGE_PLUGINS_PATH`). Enable via `LINEBRIDGE_PLUGINS=plugin1,plugin2`.

```ts
// lb-plugins/my-plugin/index.ts
export default class MyPlugin implements ServerPlugin {
  constructor(server: Server) {
    this.server = server
  }
  async initialize() {
    // Add middleware: this.server.middlewares["name"] = fn
    // Add context: this.server.contexts["key"] = value
    // Listen events: this.server.eventBus.on("event", handler)
  }
}
```

Plugin lifecycle: `require()` → `new Plugin(server)` → added to `server.plugins` Map → `initialize()`.

---

## EngineAdaptor — Abstract Engine Interface

```ts
class EngineAdaptor {
  server: LinebridgeServer
  socket_path?: string                    // unix socket path in LB_SOCKET_MODE
  ws!: any                                // RTEngine instance if WS enabled
  registers: Set<{ method, path }>        // registered routes
  base_headers: Record<string, string>

  register(route: RouteAlike): void       // register HTTP route
  register_middleware(mw: MiddlewareHandlerFunction): void
  initialize(): Promise<void>             // set up SSL, create uWS app
  listen(): Promise<void>                 // start accepting
  close(): Promise<boolean>               // graceful shutdown
}
```

---

## Neo Engine (`engines/neo/index.ts`)

The default engine on uWebSockets.js. Key details:

- Creates `uWS.App` (plain) or `uWS.SSLApp` (when `server.ssl.key` + `server.ssl.cert` exist)
- Raises uWS header limits: `UWS_HTTP_MAX_HEADERS_COUNT=512`, `UWS_HTTP_MAX_HEADERS_SIZE=650000`
- Hides `Server` header unless `KEEP_UWS_HEADER` env is set
- Unix socket mode: enabled via `LB_SOCKET_MODE=true` → listens on `/tmp/lb_node_{refName}.sock`
- WS setup: creates `RTEngine`, attaches to uWS with polyfill wrapping raw uWS sockets
- Default catch-all route: `"/*"` with `method: "any"` → 404 JSON

---

## Project Structure Convention

```
my-project/
├── index.ts              # Server subclass + Boot(MyAPI)
├── routes/               # File-based HTTP routes
│   └── users/
│       ├── get.ts
│       └── [id]/get.ts
├── ws_routes/            # File-based WS events
│   └── chat/
│       └── message.ts
├── middlewares/          # Custom middleware modules
├── classes/              # Custom classes, utilities
├── models/               # Data models
├── config/               # Configuration
├── utils/                # Utilities
├── lib/                  # Internal libraries
├── db/                   # Database files/code
├── db_models/            # Database model definitions
├── lb-plugins/           # Plugin directory
├── package.json
└── tsconfig.json
```

---

## Bootloader (`bootloader/`)

`linebridge-boot index.ts` → dotenv, sucrase/register, aliases, globals, `Module.runMain()`.

`linebridge-boot index.ts --watch` → hot-reload: forks child, watches dir (chokidar), restarts on change.

### Globals injected by bootloader

| Global | Description |
|--------|-------------|
| `Boot(ServerClass)` | Instantiate + run server |
| `ToBoolean(value)` | String/bool → bool |
| `nanoid(length?)` | Crypto-random ID (default 21 chars) |
| `b64Encode(data)` / `b64Decode(data)` | Base64 |
| `isProduction` | `NODE_ENV === "production"` |
| `defineRoute` | Type-safe route helper |
| `OperationError` | HTTP error class |
| `Array.updateFromObjectKeys(obj)` | Update array from object keys |

### Path Aliases (auto-registered)

| Alias | Path |
|-------|------|
| `@` | `src/` (main module's directory) |
| `@classes` | `src/classes/` |
| `@middlewares` | `src/middlewares/` |
| `@routes` | `src/routes/` |
| `@models` | `src/models/` |
| `@config` | `src/config/` |
| `@utils` | `src/utils/` |
| `@lib` | `src/lib/` |
| `@db` | `db/` (project root) |
| `@db_models` | `db_models/` |
| `@shared-classes` | `classes/` |
| `@shared-middlewares` | `middlewares/` |
| `@shared-utils` | `utils/` |
| `@shared-lib` | `lib/` |

---

## Environment Variables Reference

| Variable | Purpose |
|----------|---------|
| `LB_PORT` | Override listen port |
| `LB_GATEWAY_SOCKET` | Gateway IPC socket path (enables gateway mode) |
| `LB_SOCKET_MODE` | Enable Unix socket mode (`true`) |
| `KEEP_UWS_HEADER` | Keep uWS `Server` header |
| `LINEBRIDGE_PLUGINS` | Comma-separated plugin names |
| `LINEBRIDGE_PLUGINS_PATH` | Custom plugins dir path |
| `NODE_ENV` | `production` or `development` |
| `ROOT_PATH` | Project root (auto-detected) |
| `INFISICAL_CLIENT_ID/SECRET/PROJECT_ID` | Infisical secrets integration |

---

## `OperationError`

```ts
class OperationError extends Error {
  code: number     // HTTP status code (default 500)
  constructor(code: number, message: string)
}

// Usage in handlers/middlewares:
throw new OperationError(404, "User not found")
// → { status: 404, body: { error: "User not found" } }
```

Caught by the Handler execution wrapper automatically.

---

## Key TypeScript Types (`types.ts`)

| Type | Description |
|------|-------------|
| `ServerRequest<T>` | Engine-resolved Request type |
| `ServerResponse<T>` | Engine-resolved Response type |
| `KnownKeys<T>` | Literal keys (filters index signatures) |
| `ContextsKeys<T>` | Union of context key names |
| `MiddlewaresKeys<T>` | Union of middleware key names |
| `Contexts<T>` | Merged contexts (user + base) |
| `IPCEventFn` | `(contexts, data) => any` |
| `IPCEvents` | `{ [event: string]: IPCEventFn }` |
| `NatsClientContext` | `{ id, socket_id, token, user_id, userId, username, user? }` |
| `ServerPlugin` | `{ initialize?(): Promise<void> }` |
| `SSEventStream` | SSE stream interface |
| `RouteTypes` | `"http" \| "ws"` |
| `RouteHttpMethods` | `"any" \| "get" \| "post" \| "put" \| "delete" \| "patch" \| "options" \| "head"` |

---

## Common Patterns

### Basic server setup
```ts
import { Server } from "linebridge"

export default class API extends Server {
  static refName = "my-api"
  static listenPort = 3000
}
Boot(API)
```

### SSL/HTTPS
```ts
export default class SecureAPI extends Server {
  static listenPort = 443
  ssl = { key: "/path/to/privkey.pem", cert: "/path/to/fullchain.pem" }
}
```

### Full-featured example
```ts
export default class API extends Server {
  static useMiddlewares = ["logs"]

  middlewares = {
    auth: async (req, res, next) => {
      if (!req.headers["authorization"])
        return res.status(401).json({ error: "Unauthorized" })
      next()
    },
  }

  contexts = {
    db: connectToDatabase(),
    sum: (a: number, b: number) => a + b,
  }

  routes = {
    "/hi": defineRoute<API>()({
      method: "get",
      fn: async () => ({ hello: "world" }),
    }),
    "/sum/:a/:b": defineRoute<API>()({
      method: "get",
      fn: async (req, res) => ({
        result: +req.params.a + +req.params.b,
      }),
    }),
  }

  async onInitialize() { console.log("Server initializing...") }
  async afterInitialize() { console.log("Server ready!") }
  async onClose() { console.log("Server closing...") }
}
```

### Gateway mode (distributed)
```ts
export default class UserService extends Server {
  static refName = "user-service"
  static nats = { address: "127.0.0.1", port: 4222 }

  ipcEvents = {
    getUser: async (contexts, data) => {
      return await contexts.db.users.findById(data.userId)
    },
  }
}
```

### WebSocket with upgrade auth
```ts
export default class ChatAPI extends Server {
  static websockets = { enabled: true, path: "/ws" }

  async handleWsUpgrade(context: any, token: string, res: any) {
    const user = await validateToken(token)
    if (!user) return res.status(401).end()
    context.user = user
    res.upgrade(context)
  }

  wsEvents = {
    "chat:message": async (client, data) => {
      await client.toTopic("chat", "chat:message", {
        user: client.userId,
        text: data.text,
      })
    },
  }
}
```

---

## Dependencies

- **uWebSockets.js** — HTTP/WS server engine (v20.68.0)
- **tseep** — Event emitter
- **sucrase** — JIT TypeScript transpilation
- **busboy** — Multipart form parsing
- **fast-json-stringify** — Fast JSON serialization (NATS)
- **fast-querystring** — Fast query string parsing
- **cookie** + **cookie-signature** — Cookie handling
- **chokidar** — File watching (dev mode)
- **minimatch** — Glob matching (watcher ignore)
- **dotenv** — .env loading
- **@nats-io/transport-node** + **@nats-io/jetstream** — NATS messaging (optional)
- **@infisical/sdk** — Secrets management (optional)
