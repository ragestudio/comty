import { Howl } from "howler"

export class SoundEngine {
    constructor() {
        this.sounds = {}
    }

    initialize = async () => {
        this.sounds = await this.getSounds()
    }

    getSounds = async () => {
        const soundPack = await import(`http://${window.location.host}/src/assets/sounds`)
        let sounds = soundPack.default

        Object.keys(soundPack.default).forEach((key) => {
            const src = `http://${window.location.host}${sounds[key]}`

            sounds[key] = new Howl({
                src: [src]
            })
        })

        return sounds
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