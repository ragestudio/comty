import { Observable } from "object-observer"
import AudioPlayerStorage from "../player.storage"

export default class PlayerState {
    static defaultState = {
        loading: false,
        playback_status: "stopped",
        track_manifest: null,

        muted: app.isMobile ? false : (AudioPlayerStorage.get("mute") ?? false),
        volume: app.isMobile ? 1 : (AudioPlayerStorage.get("volume") ?? 0.3),
        playback_mode: AudioPlayerStorage.get("mode") ?? "normal",
    }

    constructor(player) {
        this.player = player

        this.state = Observable.from(PlayerState.defaultState)

        Observable.observe(this.state, async (changes) => {
            try {
                changes.forEach((change) => {
                    if (change.type === "update") {
                        const stateKey = change.path[0]

                        this.player.eventBus.emit(`player.state.update:${stateKey}`, change.object[stateKey])
                        this.player.eventBus.emit("player.state.update", change.object)
                    }
                })
            } catch (error) {
                this.player.console.error(`Failed to dispatch state updater >`, error)
            }
        })

        return this.state
    }
}