import Core from "evite/src/core"
import { Howl } from "howler"
import config from "config"

export default class SoundCore extends Core {
    sounds = {}

    publicMethods = {
        sound: this,
    }

    async initialize() {
        this.sounds = await this.getSounds()
    }

    getSounds = async () => {
        // TODO: Load custom soundpacks manifests
        let soundPack = config.defaultSoundPack ?? {}

        Object.keys(soundPack).forEach((key) => {
            const src = soundPack[key]

            soundPack[key] = (options) => new Howl({
                volume: window.app.settings.get("generalAudioVolume") ?? 0.5,
                ...options,
                src: [src],
            })
        })

        return soundPack
    }

    play = (name, options) => {
        if (this.sounds[name]) {
            return this.sounds[name](options).play()
        } else {
            console.error(`Sound [${name}] not found or is not available.`)
            return false
        }
    }
}