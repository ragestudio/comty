import { Howl } from "howler"

export class SoundEngine {
    constructor() {
        this.sounds = {}
    }

    initialize = async () => {
        this.sounds = await this.getSounds()
    }

    getSounds = async () => {
        const origin = process.env.NODE_ENV === "development" ? `${window.location.origin}/src/assets/sounds/index.js` : `${window.location.origin}/assets/sounds/index.js`

        let soundPack = await import(origin)
        soundPack = soundPack.default || soundPack

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