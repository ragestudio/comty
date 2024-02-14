import Core from "evite/src/core"

import SyncModel from "comty.js/models/sync"

import MusicSyncSubCore from "./subcores/music"

const internalSubCores = [
    MusicSyncSubCore
]

// TODO: Sync current state with server
export default class SyncCore extends Core {
    static namespace = "sync"
    static dependencies = ["api", "player"]

    activeLinkedServices = {}

    public = {
        getActiveLinkedServices: function () {
            return this.activeLinkedServices
        }.bind(this),
    }

    events = {
        "app.initialization.start": async () => {
            const activeServices = await SyncModel.getLinkedServices().catch((error) => {
                this.console.error(error)
                return null
            })

            if (activeServices) {
                this.console.log(`Active services`, activeServices)
                this.activeLinkedServices = activeServices
            }
        }
    }

    async onInitialize() {
        for (const [key, value] of Object.entries(this.events)) {
            app.eventBus.on(key, value)
        }

        const subCores = [
            ...internalSubCores,
        ]

        for await (let subCore of subCores) {
            subCore = new subCore(this.ctx)

            try {
                if (typeof subCore.onInitialize === "function") {
                    await subCore.onInitialize()
                }

                if (subCore.constructor.namespace && subCore.public) {
                    this.public[subCore.constructor.namespace] = subCore.public
                }
            } catch (error) {
                this.console.error(error)
            }
        }
    }
}