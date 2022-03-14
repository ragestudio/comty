import config from "config"
import { Bridge } from "linebridge/dist/client"
import { Session } from "models"
import io from "socket.io-client"

class WSInterface {
    constructor(params = {}) {
        this.params = params
        this.manager = new io.Manager(this.params.origin, {
            autoConnect: true,
            transports: ["websocket"],
            ...this.params.managerOptions,
        })
        this.sockets = {}

        this.register("/", "main")
    }

    register = (socket, as) => {
        if (typeof socket !== "string") {
            console.error("socket must be string")
            return false
        }

        socket = this.manager.socket(socket)
        return this.sockets[as ?? socket] = socket
    }
}

export default {
    key: "apiBridge",
    expose: [
        {
            initialization: [
                async (app, main) => {
                    app.apiBridge = await app.createApiBridge()

                    app.WSInterface = app.apiBridge.wsInterface
                    app.WSInterface.request = app.WSRequest
                    app.WSInterface.listen = app.handleWSListener
                    app.WSSockets = app.WSInterface.sockets
                    app.WSInterface.mainSocketConnected = false

                    app.WSSockets.main.on("authenticated", () => {
                        console.debug("[WS] Authenticated")
                    })
                    app.WSSockets.main.on("authenticateFailed", (error) => {
                        console.error("[WS] Authenticate Failed", error)
                    })

                    app.WSSockets.main.on("connect", () => {
                        window.app.eventBus.emit("websocket_connected")
                        app.WSInterface.mainSocketConnected = true
                    })

                    app.WSSockets.main.on("disconnect", (...context) => {
                        window.app.eventBus.emit("websocket_disconnected", ...context)
                        app.WSInterface.mainSocketConnected = false
                    })

                    app.WSSockets.main.on("connect_error", (...context) => {
                        window.app.eventBus.emit("websocket_connection_error", ...context)
                        app.WSInterface.mainSocketConnected = false
                    })

                    window.app.api = app.apiBridge
                    window.app.ws = app.WSInterface

                    window.app.request = app.apiBridge.endpoints
                    window.app.wsRequest = app.apiBridge.wsEndpoints
                },
            ],
            mutateContext: {
                async attachWSConnection() {
                    if (!this.WSInterface.sockets.main.connected) {
                        await this.WSInterface.sockets.main.connect()
                    }

                    let startTime = null
                    let latency = null
                    let latencyWarning = false

                    let pingInterval = setInterval(() => {
                        if (!this.WSInterface.mainSocketConnected) {
                            return clearTimeout(pingInterval)
                        }

                        startTime = Date.now()
                        this.WSInterface.sockets.main.emit("ping")
                    }, 2000)

                    this.WSInterface.sockets.main.on("pong", () => {
                        latency = Date.now() - startTime

                        if (latency > 800 && this.WSInterface.mainSocketConnected) {
                            latencyWarning = true
                            console.error("[WS] Latency is too high > 800ms", latency)
                            window.app.eventBus.emit("websocket_latency_too_high", latency)
                        } else if (latencyWarning && this.WSInterface.mainSocketConnected) {
                            latencyWarning = false
                            window.app.eventBus.emit("websocket_latency_normal", latency)
                        }
                    })
                },
                async attachAPIConnection() {
                    await this.apiBridge.initialize()
                },
                handleWSListener: (to, fn) => {
                    if (typeof to === "undefined") {
                        console.error("handleWSListener: to must be defined")
                        return false
                    }
                    if (typeof fn !== "function") {
                        console.error("handleWSListener: fn must be function")
                        return false
                    }

                    let ns = "main"
                    let event = null

                    if (typeof to === "string") {
                        event = to
                    } else if (typeof to === "object") {
                        ns = to.ns
                        event = to.event
                    }

                    return window.app.ws.sockets[ns].on(event, async (...context) => {
                        return await fn(...context)
                    })
                },
                createApiBridge: async () => {
                    const getSessionContext = async () => {
                        const obj = {}
                        const token = await Session.token

                        if (token) {
                            // append token to context
                            obj.headers = {
                                Authorization: `Bearer ${token ?? null}`,
                            }
                        }

                        return obj
                    }

                    const handleResponse = async (data) => {
                        if (data.headers?.regenerated_token) {
                            Session.token = data.headers.regenerated_token
                            console.debug("[REGENERATION] New token generated")
                        }

                        if (data instanceof Error) {
                            if (data.response.status === 401) {
                                window.app.eventBus.emit("invalid_session")
                            }
                        }
                    }

                    const bridge = new Bridge({
                        origin: config.api.address,
                        wsOrigin: config.ws.address,
                        wsOptions: {
                            autoConnect: false,
                        },
                        onRequest: getSessionContext,
                        onResponse: handleResponse,
                    })

                    return bridge
                },
                WSRequest: (socket = "main", channel, ...args) => {
                    return new Promise(async (resolve, reject) => {
                        const request = await window.app.ws.sockets[socket].emit(channel, ...args)

                        request.on("responseError", (...errors) => {
                            return reject(...errors)
                        })
                        request.on("response", (...responses) => {
                            return resolve(...responses)
                        })
                    })
                }
            },
        },
    ],
}