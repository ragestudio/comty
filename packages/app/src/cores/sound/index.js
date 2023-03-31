import Core from "evite/src/core"
import { Howl } from "howler"
import config from "config"
import axios from "axios"
import store from "store"

export default class SoundCore extends Core {
    static refName = "sound"

    static namespace = "sound"

    soundsPool = {}

    public = {
        play: this.play,
        getSounds: this.getSounds,
    }

    async initialize() {
        let soundpack = config.defaultSoundPack ?? {}

        const storedCustomSoundpack = store.get("soundpack_manifest")

        if (storedCustomSoundpack) {
            // check if is valid url with regex
            const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
      
            if (urlRegex.test(storedCustomSoundpack)) {
               // load with axios
                const { data } = await axios.get(storedCustomSoundpack) 

                soundpack = data
            } else {
                console.error(`Soundpack [${storedCustomSoundpack}] is not a valid url.`)
                return false
            }
        }

        for (const [name, path] of Object.entries(soundpack)) {
            this.soundsPool[name] = new Howl({
                volume: window.app.cores.settings.get("generalAudioVolume") ?? 0.5,
                src: [path],
            })
        }

        console.log(this.soundsPool)
    }

    async play(name, options) {
        if (this.soundsPool[name]) {
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