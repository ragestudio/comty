import EventEmitter from "@foxify/events"

import axios from "axios"
import { io } from "socket.io-client"

import remotes from "./remotes"

import request from "./handlers/request"
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

export default function createClient({
    wsEvents = Object(),
    useWs = false,
    accessKey = null,
    privateKey = null,
} = {}) {
    const sharedState = globalThis.__comty_shared_state = {
        onExpiredExceptionEvent: false,
        excludedExpiredExceptionURL: ["/session/regenerate"],
        eventBus: new EventEmitter(),
        mainOrigin: remotes.default.origin,
        instances: Object(),
        wsInstances: Object(),
        curl: null,
    }

    if (globalThis.isServerMode) {
        sharedState.curl = createHandlers()
    }

    if (privateKey && accessKey && globalThis.isServerMode) {
        Storage.engine.set("token", `${accessKey}:${privateKey}`)
    }

    // create instances for every remote
    for (const [key, remote] of Object.entries(remotes)) {
        sharedState.instances[key] = axios.create({
            baseURL: remote.origin,
        })

        if (useWs && remote.hasWebsocket) {
            sharedState.wsInstances[key] = io(remote.wsOrigin ?? remote.origin, {
                transports: ["websocket"],
                autoConnect: true,
                ...remote.wsParams ?? {},
            })
        }
    }

    // register ws events
    Object.keys(sharedState.wsInstances).forEach((key) => {
        const ws = sharedState.wsInstances[key]

        ws.on("connect", () => {
            console.log(`[WS-API][${key}] Connected`)

            if (remotes[key].needsAuth) {
                // try to auth
                ws.emit("authenticate", {
                    token: SessionModel.token,
                })
            }
        })

        ws.on("disconnect", () => {
            console.log(`[WS-API][${key}] Disconnected`)
        })

        ws.on("error", (error) => {
            console.error(`[WS-API][${key}] Error`, error)
        })

        ws.onAny((event, ...args) => {
            console.log(`[WS-API][${key}] Event recived`, event, ...args)
        })

        const customEvents = wsEvents[key]

        if (customEvents) {
            for (const [eventName, eventHandler] of Object.entries(customEvents)) {
                ws.on(eventName, eventHandler)
            }
        }
    })

    return sharedState
}