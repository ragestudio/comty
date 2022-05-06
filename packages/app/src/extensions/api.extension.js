import { Extension } from "evite"
import config from "config"
import { Bridge } from "linebridge/dist/client"
import { Session } from "models"

export default class ApiExtension extends Extension {
    constructor(app, main) {
        super(app, main)

        this.apiBridge = this.createBridge()
        this.WSInterface = this.apiBridge.wsInterface
        this.WSInterface.request = this.WSRequest
        this.WSInterface.listen = this.handleWSListener
        this.WSSockets = this.WSInterface.sockets
        this.WSInterface.mainSocketConnected = false
    }

    initializers = [
        async () => {
            this.WSSockets.main.on("authenticated", () => {
                console.debug("[WS] Authenticated")
            })
            this.WSSockets.main.on("authenticateFailed", (error) => {
                console.error("[WS] Authenticate Failed", error)
            })

            this.WSSockets.main.on("connect", () => {
                window.app.eventBus.emit("websocket_connected")
                this.WSInterface.mainSocketConnected = true
            })

            this.WSSockets.main.on("disconnect", (...context) => {
                window.app.eventBus.emit("websocket_disconnected", ...context)
                this.WSInterface.mainSocketConnected = false
            })

            this.WSSockets.main.on("connect_error", (...context) => {
                window.app.eventBus.emit("websocket_connection_error", ...context)
                this.WSInterface.mainSocketConnected = false
            })

            this.mainContext.setToWindowContext("api", this.apiBridge)
            this.mainContext.setToWindowContext("ws", this.WSInterface)

            this.mainContext.setToWindowContext("request", this.apiBridge.endpoints)
            this.mainContext.setToWindowContext("WSRequest", this.WSInterface.wsEndpoints)
        }
    ]

    createBridge() {
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
            // handle token regeneration
            if (data.headers?.regenerated_token) {
                Session.token = data.headers.regenerated_token
                console.debug("[REGENERATION] New token generated")
            }

            // handle 401 responses
            if (data instanceof Error) {
                if (data.response.status === 401) {
                    window.app.eventBus.emit("invalid_session")
                }
            }
        }

        return new Bridge({
            origin: config.api.address,
            wsOrigin: config.ws.address,
            wsOptions: {
                autoConnect: false,
            },
            onRequest: getSessionContext,
            onResponse: handleResponse,
        })
    }

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
    }

    async attachAPIConnection() {
        await this.apiBridge.initialize()
    }

    handleWSListener = (to, fn) => {
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
    }

    WSRequest = (socket = "main", channel, ...args) => {
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

    window = {
        ApiController: this
    }
}