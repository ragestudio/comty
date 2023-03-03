import Core from "evite/src/core"
import { Howl } from "howler"
import config from "config"

export default class SoundCore extends Core {
    static refName = "sound"
    
    static namespace = "sound"

    public = {
        play: this.play,
        getSounds: this.getSounds,
    }

    async getSounds() {
        // TODO: Load custom soundpacks manifests
        let soundPack = config.defaultSoundPack ?? {}

        return soundPack
    }

    async play(name, options) {
        let soundPack = await this.getSounds()

        if (soundPack[name]) {
            return new Howl({
                volume: window.app.cores.settings.get("generalAudioVolume") ?? 0.5,
                ...options,
                src: [soundPack[name]],
            }).play()
        } else {
            console.error(`Sound [${name}] not found or is not available.`)
            return false
        }
    }
}