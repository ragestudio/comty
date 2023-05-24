import Core from "evite/src/core"

import createClient from "comty.js"

import measurePing from "comty.js/handlers/measurePing"
import request from "comty.js/handlers/request"
import useRequest from "comty.js/hooks/useRequest"
import { reconnectWebsockets } from "comty.js"

export default class APICore extends Core {
    static refName = "api"
    static namespace = "api"

    instance = null

    public = {
        instance: function () {
            return this.instance
        }.bind(this),
        customRequest: request,
        listenEvent: this.listenEvent.bind(this),
        unlistenEvent: this.unlistenEvent.bind(this),
        measurePing: measurePing,
        useRequest: useRequest,
        reconnectWebsockets: reconnectWebsockets,
    }

    listenEvent(key, handler, instance) {
        this.instance.wsInstances[instance ?? "default"].on(key, handler)
    }

    unlistenEvent(key, handler, instance) {
        this.instance.wsInstances[instance ?? "default"].off(key, handler)
    }

    pendingPingsFromInstance = {}

    createPingIntervals() {
        Object.keys(this.instance.wsInstances).forEach((instance) => {
            console.debug(`[API] Creating ping interval for ${instance}`)

            if (this.instance.wsInstances[instance].pingInterval) {
                clearInterval(this.instance.wsInstances[instance].pingInterval)
            }

            this.instance.wsInstances[instance].pingInterval = setInterval(() => {
                if (this.instance.wsInstances[instance].pendingPingTry && this.instance.wsInstances[instance].pendingPingTry > 3) {
                    console.debug(`[API] Ping timeout for ${instance}`)

                    return clearInterval(this.instance.wsInstances[instance].pingInterval)
                }

                const timeStart = Date.now()

                //console.debug(`[API] Ping ${instance}`, this.instance.wsInstances[instance].pendingPingTry)

                this.instance.wsInstances[instance].emit("ping", () => {
                    this.instance.wsInstances[instance].latency = Date.now() - timeStart

                    this.instance.wsInstances[instance].pendingPingTry = 0
                })

                this.instance.wsInstances[instance].pendingPingTry = this.instance.wsInstances[instance].pendingPingTry ? this.instance.wsInstances[instance].pendingPingTry + 1 : 1
            }, 5000)

            // clear interval on close
            this.instance.wsInstances[instance].on("close", () => {
                clearInterval(this.instance.wsInstances[instance].pingInterval)
            })
        })
    }

    async onInitialize() {
        this.instance = await createClient({
            enableWs: true,
        })

        this.instance.eventBus.on("auth:login_success", () => {
            app.eventBus.emit("auth:login_success")
        })

        this.instance.eventBus.on("auth:logout_success", () => {
            app.eventBus.emit("auth:logout_success")
        })

        this.instance.eventBus.on("session.invalid", (error) => {
            app.eventBus.emit("session.invalid", error)
        })

        // make a basic request to check if the API is available
        await this.instance.instances["default"]({
            method: "GET",
            url: "/ping",
        }).catch((error) => {
            console.error("[API] Ping error", error)

            throw new Error(`
                Could not connect to the API. 
                Please check your connection and try again.
            `)
        })

        console.debug("[API] Attached to", this.instance)

        this.createPingIntervals()

        return this.instance
    }
}