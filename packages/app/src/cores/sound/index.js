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
        play: this.play.bind(this),
        loadSoundpack: this.loadSoundpack.bind(this),
        useUIAudio: function (audio_id) {
            try {
                if (window.app.cores.settings.is("ui.effects", true)) {
                    this.play(audio_id)
                }
            } catch (error) {
                console.error(error)
            }
        }.bind(this)
    }

    listenEvents = {
        "change:app.general_ui_volume": (volume) => {
            // play a sound to test volume
            this.play("test", {
                volume: volume / 100,
            })
        }
    }

    async loadSoundpack(manifest) {
        let soundpack = config.defaultSoundPack ?? {}

        const storedCustomSoundpack = manifest ?? store.get("soundpack_manifest")

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

        if (typeof soundpack.sounds !== "object") {
            console.error(`Soundpack [${soundpack.id}] is not a valid soundpack.`)
            return false
        }

        console.log(`Loading soundpack [${soundpack.id} | ${soundpack.name}] by ${soundpack.author} (${soundpack.version})`)

        for (const [name, path] of Object.entries(soundpack.sounds)) {
            this.soundsPool[name] = new Howl({
                volume: 0.5,
                src: [path],
            })
        }
    }

    async injectUseUIAudio() {
        const injectOnButtons = (event) => {
            // search for closest button
            const button = event.target.closest("button")

            // if button exist and has aria-checked attribute then play switch_on or switch_off
            if (button) {
                if (button.hasAttribute("aria-checked")) {
                   return this.public.useUIAudio(button.getAttribute("aria-checked") === "true" ? "component.slider_down" : "component.slider_up")
                }

                return this.public.useUIAudio("generic_click")
            }
        }

        document.addEventListener("click", (event) => {
            injectOnButtons(event)
        }, true)
    }

    async play(name, options = {}) {
        const audioInstance = this.soundsPool[name]

        if (!audioInstance) {
            console.error(`Sound [${name}] not found or is not available.`)
            return false
        }

        if (typeof options.volume !== "undefined") {
            audioInstance.volume(options.volume)
        } else {
            audioInstance.volume((window.app.cores.settings.get("ui.general_volume") ?? 0) / 100)
        }

        audioInstance.play()
    }

    async onInitialize() {
        await this.loadSoundpack()

        // listen eventBus
        for (const [eventName, callback] of Object.entries(this.listenEvents)) {
            window.app.eventBus.on(eventName, callback)
        }

        this.injectUseUIAudio()
    }
}