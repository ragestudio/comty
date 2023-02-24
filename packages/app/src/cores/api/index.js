import Core from "evite/src/core"
import { Bridge } from "linebridge/dist/client"

import config from "config"
import { SessionModel } from "models"

function generateWSFunctionHandler(socket, type = "listen") {
    if (!socket) {
        return null
    }

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

        switch (type) {
            case "listen": {
                return socket.sockets[ns].on(event, async (...context) => {
                    return await fn(...context)
                })
            }

            case "unlisten": {
                return socket.sockets[ns].removeListener(event)
            }

            default: {
                return null
            }
        }
    }
}

export default class ApiCore extends Core {
    static namespace = "api"

    excludedExpiredExceptionURL = ["/session/regenerate"]

    onExpiredExceptionEvent = false

    namespaces = Object()

    public = {
        namespaces: this.namespaces,
        customRequest: this.customRequest,
        request: this.request,
        withEndpoints: this.withEndpoints,
        attachBridge: this.attachBridge,
        detachBridge: this.detachBridge,
        createBridge: this.createBridge,
        autenticateWS: this.autenticateWS,
    }

    async customRequest(
        namepace = undefined,
        payload = {
            method: "GET",
        },
        ...args
    ) {
        if (typeof namepace === "undefined") {
            throw new Error("Namespace must be defined")
        }

        if (typeof this.namespaces[namepace] === "undefined") {
            throw new Error("Namespace not found")
        }

        if (typeof payload === "string") {
            payload = {
                url: payload,
            }
        }

        if (typeof payload.headers !== "object") {
            payload.headers = {}
        }

        const sessionToken = await SessionModel.token

        if (sessionToken) {
            payload.headers["Authorization"] = `Bearer ${sessionToken}`

        } else {
            console.warn("Making a request with no session token")
        }

        return await this.namespaces[namepace].httpInterface(payload, ...args)
    }

    request(namespace = "main", method, endpoint, ...args) {
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

    withEndpoints(namespace = "main") {
        if (!this.namespaces[namespace]) {
            throw new Error(`Namespace ${namespace} not found`)
        }

        return this.namespaces[namespace].endpoints
    }

    async handleBeforeRequest(request) {
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

    async handleRegenerationEvent(refreshToken, makeRequest) {
        window.app.eventBus.emit("session.expiredExceptionEvent", refreshToken)

        this.onExpiredExceptionEvent = true

        const expiredToken = await SessionModel.token

        // send request to regenerate token
        const response = await this.customRequest("main", {
            method: "POST",
            url: "/session/regenerate",
            data: {
                expiredToken: expiredToken,
                refreshToken,
            }
        }).catch((error) => {
            console.error(`Failed to regenerate token: ${error.message}`)
            return false
        })

        if (!response) {
            return window.app.eventBus.emit("session.invalid", "Failed to regenerate token")
        }

        // set new token
        SessionModel.token = response.token

        //this.namespaces["main"].internalAbortController.abort()

        this.onExpiredExceptionEvent = false

        // emit event
        window.app.eventBus.emit("session.regenerated")
    }

    attachBridge(key, params) {
        return this.namespaces[key] = this.createBridge(params)
    }

    detachBridge(key) {
        return delete this.namespaces[key]
    }

    createBridge(params = {}) {
        const getSessionContext = async () => {
            const obj = {}
            const token = await SessionModel.token

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

        // handle main ws onEvents
        const mainWSSocket = bridge.wsInterface.sockets["main"]

        mainWSSocket.on("authenticated", () => {
            console.debug("[WS] Authenticated")
        })

        mainWSSocket.on("authenticateFailed", (error) => {
            console.error("[WS] Authenticate Failed", error)
        })

        mainWSSocket.on("connect", () => {
            if (this.ctx.eventBus) {
                this.ctx.eventBus.emit(`api.ws.main.connect`)
            }

            this.autenticateWS(mainWSSocket)
        })

        mainWSSocket.on("disconnect", (...context) => {
            if (this.ctx.eventBus) {
                this.ctx.eventBus.emit(`api.ws.main.disconnect`, ...context)
            }
        })

        mainWSSocket.on("connect_error", (...context) => {
            if (this.ctx.eventBus) {
                this.ctx.eventBus.emit(`api.ws.main.connect_error`, ...context)
            }
        })

        // generate functions
        bridge.listenEvent = generateWSFunctionHandler(bridge.wsInterface, "listen")
        bridge.unlistenEvent = generateWSFunctionHandler(bridge.wsInterface, "unlisten")

        // return bridge
        return bridge
    }

    async autenticateWS(socket) {
        const token = await SessionModel.token

        if (token) {
            socket.emit("authenticate", {
                token,
            })
        }
    }
}