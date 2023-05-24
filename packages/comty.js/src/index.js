import EventEmitter from "@foxify/events"

import axios from "axios"
import { io } from "socket.io-client"

import remotes from "./remotes"

//import request from "./handlers/request"
import Storage from "./helpers/withStorage"

import SessionModel from "./models/session"
import { createHandlers } from "./models"

globalThis.isServerMode = typeof window === "undefined" && typeof global !== "undefined"

if (globalThis.isServerMode) {
    const { Buffer } = require("buffer")

    globalThis.b64Decode = (data) => {
        return Buffer.from(data, "base64").toString("utf-8")
    }
    globalThis.b64Encode = (data) => {
        return Buffer.from(data, "utf-8").toString("base64")
    }
}

export async function createWebsockets() {
    const instances = globalThis.__comty_shared_state.wsInstances

    for (let [key, instance] of Object.entries(instances)) {
        if (instance.connected) {
            // disconnect first
            instance.disconnect()
        }

        // remove current listeners
        instance.removeAllListeners()

        delete globalThis.__comty_shared_state.wsInstances[key]
    }

    for (let [key, remote] of Object.entries(remotes)) {
        if (!remote.hasWebsocket) {
            continue
        }

        let opts = {
            transports: ["websocket"],
            autoConnect: remote.autoConnect ?? true,
            ...remote.wsParams ?? {},
        }

        if (remote.noAuth !== true) {
            opts.auth = {
                token: SessionModel.token,
            }
        }

        globalThis.__comty_shared_state.wsInstances[key] = io(remote.wsOrigin ?? remote.origin, opts)
    }

    // regsister events
    for (let [key, instance] of Object.entries(instances)) {
        instance.on("connect", () => {
            console.debug(`[WS-API][${key}] Connected`)

            if (remotes[key].useClassicAuth && remotes[key].noAuth !== true) {
                // try to auth
                instance.emit("authenticate", {
                    token: SessionModel.token,
                })
            }

            globalThis.__comty_shared_state.eventBus.emit(`${key}:connected`)
        })

        instance.on("disconnect", () => {
            console.debug(`[WS-API][${key}] Disconnected`)

            globalThis.__comty_shared_state.eventBus.emit(`${key}:disconnected`)
        })

        instance.on("error", (error) => {
            console.error(`[WS-API][${key}] Error`, error)

            globalThis.__comty_shared_state.eventBus.emit(`${key}:error`, error)
        })

        instance.onAny((event, ...args) => {
            console.debug(`[WS-API][${key}] Event (${event})`, ...args)

            globalThis.__comty_shared_state.eventBus.emit(`${key}:${event}`, ...args)
        })
    }
}

export async function reconnectWebsockets() {
    const instances = globalThis.__comty_shared_state.wsInstances

    for (let [key, instance] of Object.entries(instances)) {
        if (instance.connected) {
            // disconnect first
            instance.disconnect()
        }

        if (remotes[key].noAuth !== true) {
            instance.auth = {
                token: SessionModel.token,
            }
        }

        instance.connect()
    }
}

export default function createClient({
    accessKey = null,
    privateKey = null,
    enableWs = false,
} = {}) {
    const sharedState = globalThis.__comty_shared_state = {
        onExpiredExceptionEvent: false,
        excludedExpiredExceptionURL: ["/session/regenerate"],
        eventBus: new EventEmitter(),
        mainOrigin: remotes.default.origin,
        instances: Object(),
        wsInstances: Object(),
        rest: null,
    }

    if (globalThis.isServerMode) {
        sharedState.rest = createHandlers()
    }

    if (privateKey && accessKey && globalThis.isServerMode) {
        Storage.engine.set("token", `${accessKey}:${privateKey}`)
    }

    // create instances for every remote
    for (const [key, remote] of Object.entries(remotes)) {
        sharedState.instances[key] = axios.create({
            baseURL: remote.origin,
        })
    }

    if (enableWs) {
        createWebsockets()
    }

    return sharedState
}