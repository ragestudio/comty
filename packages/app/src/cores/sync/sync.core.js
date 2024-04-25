import Core from "evite/src/core"
import SyncModel from "comty.js/models/sync"

export default class SyncCore extends Core {
    static namespace = "sync"
    static dependencies = ["api", "settings"]

    activeLinkedServices = {}

    services = {

    }

    public = {
        getActiveLinkedServices: function () {
            return this.activeLinkedServices
        }.bind(this),
        services: this.services,
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
}