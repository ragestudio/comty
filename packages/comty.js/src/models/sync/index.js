import spotifyService from "./services/spotify"
import tidalService from "./services/tidal"
import vrcService from "./services/vrc"

import request from "../../handlers/request"

const sync_services = {
    spotify: spotifyService,
    tidal: tidalService,
    vrc: vrcService,
}

export default class SyncModel {
    static get spotifyCore() {
        return sync_services.spotify
    }

    static get tidalCore() {
        return sync_services.tidal
    }

    static get vrcCore() {
        return sync_services.vrc
    }

    static async linkService(namespace) {
        const service = sync_services[namespace]

        if (!service || typeof service.linkAccount !== "function") {
            throw new Error(`Service ${namespace} not found or not accepting linking.`)
        }

        return await service.linkAccount()
    }

    static async unlinkService(namespace) {
        const service = sync_services[namespace]

        if (!service || typeof service.unlinkAccount !== "function") {
            throw new Error(`Service ${namespace} not found or not accepting unlinking.`)
        }

        return await service.unlinkAccount()
    }

    static async hasServiceLinked(namespace) {
        const service = sync_services[namespace]

        if (!service || typeof service.isActive !== "function") {
            throw new Error(`Service ${namespace} not found or not accepting linking.`)
        }

        return await service.isActive()
    }

    static async getLinkedServices() {
        const response = await request({
            instance: globalThis.__comty_shared_state.instances["sync"],
            method: "GET",
            url: "/active_services",
        })

        return response.data
    }
}