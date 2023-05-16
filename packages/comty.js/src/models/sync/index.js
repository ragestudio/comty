import SpotifySyncModel from "./cores/spotifyCore"

export default class SyncModel {
    static get bridge() {
        return window.app?.cores.api.withEndpoints()
    }

    static get spotifyCore() {
        return SpotifySyncModel
    }
}