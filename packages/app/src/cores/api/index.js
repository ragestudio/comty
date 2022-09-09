import Core from "evite/src/core"
import config from "config"
import { Bridge } from "linebridge/dist/client"
import { Session } from "models"

export default class ApiCore extends Core {
    constructor(props) {
        super(props)

        this.namespaces = Object()

        this.onExpiredExceptionEvent = false
        this.excludedExpiredExceptionURL = ["/regenerate_session_token"]

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

    handleBeforeRequest = async (request) => {
        if (this.onExpiredExceptionEvent) {
            if (this.excludedExpiredExceptionURL.includes(request.url)) return

            await new Promise((resolve) => {
                app.eventBus.once("session.regenerated", () => {
                    console.log(`Session has been regenerated, retrying request`)
                    resolve()
                })
            })
        }
    }

    handleRegenerationEvent = async (refreshToken, makeRequest) => {
        window.app.eventBus.emit("session.expiredExceptionEvent", refreshToken)

        this.onExpiredExceptionEvent = true

        const expiredToken = await Session.token

        // exclude regeneration endpoint

        // send request to regenerate token
        const response = await this.request("main", "post", "regenerateSessionToken", {
            expiredToken: expiredToken,
            refreshToken,
        }).catch((error) => {
            console.error(`Failed to regenerate token: ${error.message}`)
            return false
        })

        if (!response) {
            return window.app.eventBus.emit("session.invalid", "Failed to regenerate token")
        }

        // set new token
        Session.token = response.token

        //this.namespaces["main"].internalAbortController.abort()

        this.onExpiredExceptionEvent = false

        // emit event
        window.app.eventBus.emit("session.regenerated")
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

        const handleResponse = async (data, makeRequest) => {
            // handle 401 responses
            if (data instanceof Error) {
                if (data.response.status === 401) {
                    // check if the server issue a refresh token on data
                    if (data.response.data.refreshToken) {
                        // handle regeneration event
                        await this.handleRegenerationEvent(data.response.data.refreshToken, makeRequest)
                        return await makeRequest()
                    } else {
                        return window.app.eventBus.emit("session.invalid", "Session expired, but the server did not issue a refresh token")
                    }
                }
                if (data.response.status === 403) {
                    return window.app.eventBus.emit("session.invalid", "Session not valid or not existent")
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
            onBeforeRequest: this.handleBeforeRequest,
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