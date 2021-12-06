import config from 'config'
import { Bridge } from "linebridge/client"
import { Session } from "models"
import io from "socket.io-client"

export default {
    key: "apiBridge",
    expose: [
        {
            mutateContext: {
                async initializeDefaultBridge() {
                    this.apiBridge = await this.createBridge()
                    this.ws = io(config.ws.address, { transports: ["websocket"] })

                    this.ws.on("connect", (...context) => {
                        window.app.eventBus.emit("websocket_connected", ...context)
                    })

                    this.ws.on("disconnect", (...context) => {
                        window.app.eventBus.emit("websocket_disconnected", ...context)
                    })

                    this.ws.on("connect_error", (...context) => {
                        window.app.eventBus.emit("websocket_connection_error", ...context)
                    })

                    window.app.ws = this.ws
                    window.app.api = this.apiBridge
                    window.app.request = this.apiBridge.endpoints
                },
                createBridge: async () => {
                    const getSessionContext = () => {
                        const obj = {}
                        const token = Session.token

                        if (typeof token !== "undefined") {
                            obj.headers = {
                                Authorization: `Bearer ${token ?? null}`,
                            }
                        }

                        return obj
                    }

                    const bridge = new Bridge({
                        origin: config.api.address,
                        onRequestContext: getSessionContext,
                    })

                    await bridge.initialize().catch((err) => {
                        throw {
                            message: "Failed to connect with API",
                            description: err.message,
                        }
                    })

                    return bridge
                },
            },
        },
    ],
}