import Core from "evite/src/core"

import createClient from "comty.js"

import measurePing from "comty.js/handlers/measurePing"
import request from "comty.js/handlers/request"
import useRequest from "comty.js/hooks/useRequest"

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
    }

    listenEvent(key, handler, instance) {
        this.instance.wsInstances[instance ?? "default"].on(key, handler)
    }

    unlistenEvent(key, handler, instance) {
        this.instance.wsInstances[instance ?? "default"].off(key, handler)
    }

    async onInitialize() {
        this.instance = await createClient({
            useWs: true,
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

        return this.instance
    }
}