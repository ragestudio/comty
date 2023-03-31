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
    static refName = "api"
    static namespace = "api"
    static depends = ["settings"]

    excludedExpiredExceptionURL = ["/session/regenerate"]

    onExpiredExceptionEvent = false

    instance = null

    public = {
        instance: function () {
            return this.instance
        }.bind(this),
        customRequest: this.customRequest.bind(this),
        request: this.request.bind(this),
        withEndpoints: this.withEndpoints.bind(this),
        attach: this.attach.bind(this),
        createBridge: this.createBridge.bind(this),
        autenticateWS: this.autenticateWS.bind(this),
        listenEvent: this.listenEvent.bind(this),
        unlistenEvent: this.unlistenEvent.bind(this),
        measurePing: this.measurePing.bind(this),
    }

    async attach() {
        // get remotes origins from config
        const defaultRemotes = config.remotes

        // get storaged	remotes origins
        const storedRemotes = await app.cores.settings.get("remotes") ?? {}

        const origin = storedRemotes.mainApi ?? defaultRemotes.mainApi

        this.instance = this.createBridge({
            origin,
        })

        await this.instance.initialize()

        console.debug(`[API] Attached to ${origin}`, this.instance)

        return this.instance
    }

    async customRequest(
        request = {
            method: "GET",
        },
        ...args
    ) {
        // handle before request
        await this.handleBeforeRequest(request)

        if (typeof request === "string") {
            request = {
                url: request,
            }
        }

        if (typeof request.headers !== "object") {
            request.headers = {}
        }

        let result = null

        const makeRequest = async () => {
            const sessionToken = await SessionModel.token

            if (sessionToken) {
                request.headers["Authorization"] = `Bearer ${sessionToken}`
            } else {
                console.warn("Making a request with no session token")
            }

            const _result = await this.instance.httpInterface(request, ...args)
                .catch((error) => {
                    return error
                })

            result = _result
        }

        await makeRequest()

        // handle after request
        await this.handleAfterRequest(result, makeRequest)

        // if error, throw it
        if (result instanceof Error) {
            throw result
        }

        return result
    }

    request(method, endpoint, ...args) {
        return this.instance.endpoints[method][endpoint](...args)
    }

    withEndpoints() {
        return this.instance.endpoints
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

    handleAfterRequest = async (data, callback) => {
        // handle 401 responses
        if (data instanceof Error) {
            if (data.response.status === 401) {
                // check if the server issue a refresh token on data
                if (data.response.data.refreshToken) {
                    console.log(`Session expired, but the server issued a refresh token, handling regeneration event`)

                    // handle regeneration event
                    await this.handleRegenerationEvent(data.response.data.refreshToken)

                    return await callback()
                } else {
                    return window.app.eventBus.emit("session.invalid", "Session expired, but the server did not issue a refresh token")
                }
            }
            if (data.response.status === 403) {
                return window.app.eventBus.emit("session.invalid", "Session not valid or not existent")
            }
        }
    }

    handleRegenerationEvent = async (refreshToken) => {
        window.app.eventBus.emit("session.expiredExceptionEvent", refreshToken)

        this.onExpiredExceptionEvent = true

        const expiredToken = await SessionModel.token

        // send request to regenerate token
        const response = await this.customRequest({
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

        if (!response.data?.token) {
            return window.app.eventBus.emit("session.invalid", "Failed to regenerate token, invalid server response.")
        }

        // set new token
        SessionModel.token = response.data.token

        //this.namespaces["main"].internalAbortController.abort()

        this.onExpiredExceptionEvent = false

        // emit event
        window.app.eventBus.emit("session.regenerated")
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

        if (typeof params !== "object") {
            throw new Error("Params must be an object")
        }

        const bridgeOptions = {
            wsOptions: {
                autoConnect: false,
            },
            onBeforeRequest: this.handleBeforeRequest,
            onRequest: getSessionContext,
            onResponse: this.handleAfterRequest,
            ...params,
            origin: params.httpAddress ?? config.remotes.mainApi,
        }

        const bridge = new Bridge(bridgeOptions)

        // handle main ws onEvents
        const mainSocket = bridge.wsInterface.sockets["main"]

        mainSocket.on("authenticated", () => {
            console.debug("[WS] Authenticated")
        })

        mainSocket.on("authenticateFailed", (error) => {
            console.error("[WS] Authenticate Failed", error)
        })

        mainSocket.on("connect", () => {
            if (this.ctx.eventBus) {
                this.ctx.eventBus.emit(`api.ws.main.connect`)
            }

            console.debug("[WS] Connected, authenticating...")

            this.autenticateWS(mainSocket)
        })

        mainSocket.on("disconnect", (...context) => {
            if (this.ctx.eventBus) {
                this.ctx.eventBus.emit(`api.ws.main.disconnect`, ...context)
            }
        })

        mainSocket.on("connect_error", (...context) => {
            if (this.ctx.eventBus) {
                this.ctx.eventBus.emit(`api.ws.main.connect_error`, ...context)
            }
        })

        mainSocket.onAny((event, ...args) => {
            console.debug(`[WS] Recived Event (${event})`, ...args)
        })

        // mainSocket.onAnyOutgoing((event, ...args) => {
        //     console.debug(`[WS] Sent Event (${event})`, ...args)
        // })

        return bridge
    }

    listenEvent(event, callback) {
        if (!this.instance.wsInterface) {
            throw new Error("API is not attached")
        }

        return this.instance.wsInterface.sockets["main"].on(event, callback)
    }

    unlistenEvent(event, callback) {
        if (!this.instance.wsInterface) {
            throw new Error("API is not attached")
        }

        return this.instance.wsInterface.sockets["main"].off(event, callback)
    }

    async autenticateWS(socket) {
        const token = await SessionModel.token

        if (!token) {
            return console.error("Failed to authenticate WS, no token found")
        }

        socket.emit("authenticate", {
            token,
        })
    }

    async measurePing() {
        const timings = {}

        const promises = [
            new Promise(async (resolve) => {
                const start = Date.now()

                this.customRequest({
                    method: "GET",
                    url: "/ping",
                })
                    .then(() => {
                        // set http timing in ms
                        timings.http = Date.now() - start

                        resolve()
                    })
                    .catch(() => {
                        timings.http = "failed"
                        resolve()
                    })

                setTimeout(() => {
                    timings.http = "failed"

                    resolve()
                }, 10000)
            }),
            new Promise((resolve) => {
                const start = Date.now()

                this.instance.wsInterface.sockets["main"].on("pong", () => {
                    timings.ws = Date.now() - start

                    resolve()
                })

                this.instance.wsInterface.sockets["main"].emit("ping")

                setTimeout(() => {
                    timings.ws = "failed"

                    resolve()
                }, 10000)
            })
        ]

        await Promise.all(promises)

        return timings
    }
}