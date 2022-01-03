import { Howl } from "howler"
import config from "config"

export class SoundEngine {
    constructor() {
        this.sounds = {}
    }

    initialize = async () => {
        this.sounds = await this.getSounds()
    }

    getSounds = async () => {
        // TODO: Load custom soundpacks manifests
        let soundPack = config.defaultSoundPack ?? {}

        Object.keys(soundPack).forEach((key) => {
            const src = soundPack[key]

            soundPack[key] = new Howl({
                src: [src]
            })
        })

        return soundPack
    }

    play = (name) => {
        if (this.sounds[name]) {
            this.sounds[name].play()
        } else {
            console.error(`Sound ${name} not found.`)
        }
    }
}

export const extension = {
    key: "soundEngine",
    expose: [
        {
            initialization: [
                async (app, main) => {
                    app.SoundEngine = new SoundEngine()
                    await app.SoundEngine.initialize()
                }
            ]
        }
    ]
}