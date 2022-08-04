import Core from "evite/src/core"
import config from "config"
import { Bridge } from "linebridge/dist/client"
import { Session } from "models"

export default class ApiCore extends Core {
    constructor(props) {
        super(props)

        this.namespaces = Object()

        this.ctx.registerPublicMethod("api", this)
    }

    request = (namespace = "main", method, endpoint, ...args) => {
        if (!this.namespaces[namespace]) {
            throw new Error(`Namespace ${namespace} not found`)
        }

        if (!this.namespaces[namespace].endpoints[method]) {
            throw new Error(`Method ${method} not found`)
        }

        if (!this.namespaces[namespace].endpoints[method][endpoint]) {
            throw new Error(`Endpoint ${endpoint} not found`)
        }

        return this.namespaces[namespace].endpoints[method][endpoint](...args)
    }

    withEndpoints = (namespace = "main") => {
        if (!this.namespaces[namespace]) {
            throw new Error(`Namespace ${namespace} not found`)
        }

        return this.namespaces[namespace].endpoints
    }

    connectBridge = (key, params) => {
        this.namespaces[key] = this.createBridge(params)
    }

    createBridge(params = {}) {
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

        if (typeof params !== "object") {
            throw new Error("Params must be an object")
        }

        const bridgeOptions = {
            wsOptions: {
                autoConnect: false,
            },
            onRequest: getSessionContext,
            onResponse: handleResponse,
            ...params,
            origin: params.httpAddress ?? config.remotes.mainApi,
        }

        const bridge = new Bridge(bridgeOptions)

        // handle main ws events
        const mainWSSocket = bridge.wsInterface.sockets["main"]

        mainWSSocket.on("authenticated", () => {
            console.debug("[WS] Authenticated")
        })

        mainWSSocket.on("authenticateFailed", (error) => {
            console.error("[WS] Authenticate Failed", error)
        })

        mainWSSocket.on("connect", () => {
            this.ctx.eventBus.emit(`api.ws.${mainWSSocket.id}.connect`)
        })

        mainWSSocket.on("disconnect", (...context) => {
            this.ctx.eventBus.emit(`api.ws.${mainWSSocket.id}.disconnect`, ...context)
        })

        mainWSSocket.on("connect_error", (...context) => {
            this.ctx.eventBus.emit(`api.ws.${mainWSSocket.id}.connect_error`, ...context)
        })

        // generate functions
        bridge.listenEvent = this.generateMainWSEventListener(bridge.wsInterface)
        bridge.unlistenEvent = this.generateMainWSEventUnlistener(bridge.wsInterface)

        // return bridge
        return bridge
    }

    generateMainWSEventListener(obj) {
        return (to, fn) => {
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

            return obj.sockets[ns].on(event, async (...context) => {
                return await fn(...context)
            })
        }
    }

    generateMainWSEventUnlistener(obj) {
        return (to, fn) => {
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

            return obj.sockets[ns].removeListener(event, fn)
        }
    }
}