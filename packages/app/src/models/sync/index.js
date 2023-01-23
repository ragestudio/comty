import SpotifySyncModel from "./spotify"

export default class SyncModel {
    static get bridge() {
        return window.app?.api.withEndpoints("main")
    }

    static get spotifyCore() {
        return SpotifySyncModel
    }
}