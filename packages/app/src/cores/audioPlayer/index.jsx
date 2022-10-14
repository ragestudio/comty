import Core from "evite/src/core"

import React from "react"
import { Howl } from "howler"

import { EmbbededMediaPlayer } from "components"
import { DOMWindow } from "components/RenderWindow"

export default class AudioPlayerCore extends Core {
    audioMuted = false
    audioVolume = 1

    audioQueueHistory = []
    audioQueue = []
    currentAudio = null

    currentDomWindow = null

    preloadAudioDebounce = null

    publicMethods = {
        AudioPlayer: this,
    }

    async initialize() {
        app.eventBus.on("audioPlayer.end", () => {
            this.nextAudio()
        })
    }

    toogleMute() {
        this.audioMuted = !this.audioMuted

        if (this.currentAudio) {
            this.currentAudio.instance.mute(this.audioMuted)
        }

        // apply to all audio in queue
        this.audioQueue.forEach((audio) => {
            audio.instance.mute(this.audioMuted)
        })

        app.eventBus.emit("audioPlayer.muted", this.audioMuted)

        return this.audioMuted
    }

    setVolume(volume) {
        if (typeof volume !== "number") {
            console.warn("Volume must be a number")
            return false
        }

        if (volume > 1) {
            volume = 1
        }

        if (volume < 0) {
            volume = 0
        }

        this.audioVolume = volume

        if (this.currentAudio) {
            this.currentAudio.instance.volume(volume)
        }

        // apply to all audio in queue
        this.audioQueue.forEach((audio) => {
            audio.instance.volume(volume)
        })

        app.eventBus.emit("audioPlayer.volumeChanged", volume)

        return volume
    }

    async preloadAudio() {
        // debounce to prevent multiple preload
        if (this.preloadAudioDebounce) {
            clearTimeout(this.preloadAudioDebounce)
        }

        this.preloadAudioDebounce = setTimeout(async () => {
            // load the first 2 audio in queue
            const audioToLoad = this.audioQueue.slice(0, 2)

            // filter undefined
            const audioToLoadFiltered = audioToLoad.filter((audio) => audio.instance)

            audioToLoad.forEach(async (audio) => {
                const audioState = audio.instance.state()

                if (audioState !== "loaded" && audioState !== "loading") {
                    await audio.instance.load()
                }
            })
        }, 600)
    }

    startPlaylist = async (data) => {
        if (typeof data === "undefined") {
            console.warn("No data provided")
            return false
        }

        if (!Array.isArray(data)) {
            data = [data]
        }

        await this.clearAudioQueues()

        this.attachEmbbededMediaPlayer()

        for await (const item of data) {
            const audioInstance = await this.createAudioInstance(item)

            await this.audioQueue.push({
                data: item,
                instance: audioInstance,
            })
        }
        await this.preloadAudio()

        this.currentAudio = this.audioQueue.shift()

        this.playCurrentAudio()
    }

    clearAudioQueues() {
        if (this.currentAudio) {
            this.currentAudio.instance.stop()
        }

        this.audioQueueHistory = []
        this.audioQueue = []
        this.currentAudio = null
    }

    async playCurrentAudio() {
        if (!this.currentAudio) {
            console.warn("No audio playing")
            return false
        }

        const audioState = this.currentAudio.instance.state()

        console.log(`Current Audio State: ${audioState}`)

        // check if the instance is loaded
        if (audioState !== "loaded") {
            console.warn("Audio not loaded")

            app.eventBus.emit("audioPlayer.loading", this.currentAudio)
            
            await  this.currentAudio.instance.load()

            app.eventBus.emit("audioPlayer.loaded", this.currentAudio)
        }

        this.currentAudio.instance.play()
    }

    pauseAudioQueue() {
        if (!this.currentAudio) {
            console.warn("No audio playing")
            return false
        }

        this.currentAudio.instance.pause()
    }

    previousAudio() {
        // check if there is audio playing
        if (this.currentAudio) {
            this.currentAudio.instance.stop()
        }

        // check if there is audio in queue
        if (!this.audioQueueHistory[0]) {
            console.warn("No audio in queue")
            return false
        }

        // move current audio to queue
        this.audioQueue.unshift(this.currentAudio)

        this.currentAudio = this.audioQueueHistory.pop()

        this.playCurrentAudio()
    }

    nextAudio() {
        // check if there is audio playing
        if (this.currentAudio) {
            this.currentAudio.instance.stop()
        }

        // check if there is audio in queue
        if (!this.audioQueue[0]) {
            console.warn("No audio in queue")

            this.currentAudio = null

            // if there is no audio in queue, close the embbeded media player
            this.destroyPlayer()

            return false
        }

        // move current audio to history
        this.audioQueueHistory.push(this.currentAudio)

        this.currentAudio = this.audioQueue.shift()

        this.playCurrentAudio()

        this.preloadAudio()
    }

    destroyPlayer() {
        this.currentDomWindow.destroy()
        this.currentDomWindow = null
    }

    async createAudioInstance(data) {
        const audio = new Howl({
            src: data.src,
            preload: false,
            //html5: true,
            mute: this.audioMuted,
            volume: this.audioVolume,
            onplay: () => {
                app.eventBus.emit("audioPlayer.playing", data)
            },
            onend: () => {
                app.eventBus.emit("audioPlayer.end", data)
            },
            onload: () => {
                app.eventBus.emit("audioPlayer.preloaded", data)
            },
            onpause: () => {
                app.eventBus.emit("audioPlayer.paused", data)
            },
            onstop: () => {
                app.eventBus.emit("audioPlayer.stopped", data)
            },
            onseek: () => {
                app.eventBus.emit("audioPlayer.seeked", data)
            },
            onvolume: () => {
                app.eventBus.emit("audioPlayer.volumeChanged", data)
            },
        })

        return audio
    }

    attachEmbbededMediaPlayer() {
        if (this.currentDomWindow) {
            console.warn("EmbbededMediaPlayer already attached")
            return false
        }

        this.currentDomWindow = new DOMWindow({
            id: "mediaPlayer"
        })

        this.currentDomWindow.render(<EmbbededMediaPlayer />)
    }
}