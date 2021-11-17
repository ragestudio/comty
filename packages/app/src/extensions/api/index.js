import config from 'config'
import { Bridge } from "linebridge/client"
import { Session } from "models"

export default {
    key: "apiBridge",
    expose: [
        {
            mutateContext: {
                async initializeDefaultBridge() {
                    this.apiBridge = await this.createBridge()

                    window.app.apiBridge = this.apiBridge
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
                        origin: config.api?.address,
                        onRequestContext: getSessionContext,
                    })

                    await bridge.initialize().catch((err) => {
                        throw {
                            message: "Failed to connect with API",
                            description: err.message,
                        }
                    })

                    return bridge.endpoints
                },
            },
        },
    ],
}