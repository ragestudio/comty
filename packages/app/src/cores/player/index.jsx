import Core from "evite/src/core"
import { Observable } from "object-observer"
import store from "store"
// import { createRealTimeBpmProcessor } from "realtime-bpm-analyzer"

import { EmbbededMediaPlayer } from "components"
import { DOMWindow } from "components/RenderWindow"

class AudioPlayerStorage {
    static storeKey = "audioPlayer"

    static get(key) {
        const data = store.get(AudioPlayerStorage.storeKey)

        if (data) {
            return data[key]
        }

        return null
    }

    static set(key, value) {
        const data = store.get(AudioPlayerStorage.storeKey) ?? {}

        data[key] = value

        store.set(AudioPlayerStorage.storeKey, data)

        return data
    }
}

export default class Player extends Core {
    static refName = "player"

    static namespace = "player"

    currentDomWindow = null

    audioContext = new AudioContext()

    audioQueueHistory = []
    audioQueue = []
    audioProcessors = []

    currentAudioInstance = null

    state = Observable.from({
        loading: false,
        audioMuted: AudioPlayerStorage.get("mute") ?? false,
        playbackMode: AudioPlayerStorage.get("mode") ?? "repeat",
        audioVolume: AudioPlayerStorage.get("volume") ?? 0.3,
        velocity: AudioPlayerStorage.get("velocity") ?? 1,

        currentAudioManifest: null,
        playbackStatus: "stopped",
        crossfading: false,
        trackBPM: 0,
    })

    public = {
        audioContext: this.audioContext,
        attachPlayerComponent: this.attachPlayerComponent.bind(this),
        detachPlayerComponent: this.detachPlayerComponent.bind(this),
        toogleMute: this.toogleMute.bind(this),
        volume: this.volume.bind(this),
        start: this.start.bind(this),
        startPlaylist: this.startPlaylist.bind(this),
        playback: {
            mode: function (mode) {
                if (mode) {
                    this.state.playbackMode = mode
                }

                return this.state.playbackMode
            }.bind(this),
            toogle: function () {
                if (!this.currentAudioInstance) {
                    console.error("No audio instance")
                    return null
                }

                if (this.currentAudioInstance.audioElement.paused) {
                    this.public.playback.play()
                } else {
                    this.public.playback.pause()
                }
            }.bind(this),
            play: function () {
                if (!this.currentAudioInstance) {
                    console.error("No audio instance")
                    return null
                }

                // set gain exponentially
                this.currentAudioInstance.gainNode.gain.linearRampToValueAtTime(
                    this.state.audioVolume,
                    this.audioContext.currentTime + 0.1
                )

                setTimeout(() => {
                    this.currentAudioInstance.audioElement.play()
                }, 100)

            }.bind(this),
            pause: function () {
                if (!this.currentAudioInstance) {
                    console.error("No audio instance")
                    return null
                }

                // set gain exponentially
                this.currentAudioInstance.gainNode.gain.linearRampToValueAtTime(
                    0.0001,
                    this.audioContext.currentTime + 0.1
                )

                setTimeout(() => {
                    this.currentAudioInstance.audioElement.pause()
                }, 100)
            }.bind(this),
            next: this.next.bind(this),
            previous: this.previous.bind(this),
            stop: this.stop.bind(this),
            status: function () {
                return this.state.playbackStatus
            }.bind(this),
        },
        getState: function (key) {
            if (key) {
                return this.state[key]
            }

            return this.state
        }.bind(this),
        seek: this.seek.bind(this),
        duration: this.duration.bind(this),
        velocity: this.velocity.bind(this),
    }

    async onInitialize() {
        Observable.observe(this.state, (changes) => {
            changes.forEach((change) => {
                if (change.type === "update") {
                    switch (change.path[0]) {
                        case "trackBPM": {
                            app.eventBus.emit("player.bpm.update", change.object.trackBPM)

                            break
                        }
                        case "crossfading": {
                            app.eventBus.emit("player.crossfading.update", change.object.crossfading)

                            console.log("crossfading", change.object.crossfading)

                            break
                        }
                        case "loading": {
                            app.eventBus.emit("player.loading.update", change.object.loading)

                            break
                        }
                        case "currentAudioManifest": {
                            app.eventBus.emit("player.current.update", change.object.currentAudioManifest)

                            break
                        }
                        case "audioMuted": {
                            AudioPlayerStorage.set("muted", change.object.audioMuted)

                            app.eventBus.emit("player.mute.update", change.object.audioMuted)

                            break
                        }
                        case "audioVolume": {
                            AudioPlayerStorage.set("volume", change.object.audioVolume)

                            app.eventBus.emit("player.volume.update", change.object.audioVolume)

                            break
                        }
                        case "velocity": {
                            AudioPlayerStorage.set("velocity", change.object.velocity)

                            app.eventBus.emit("player.velocity.update", change.object.velocity)

                            break
                        }
                        case "playbackMode": {
                            AudioPlayerStorage.set("mode", change.object.playbackMode)

                            this.currentAudioInstance.audioElement.loop = change.object.playbackMode === "repeat"

                            app.eventBus.emit("player.mode.update", change.object.playbackMode)

                            break
                        }
                        case "playbackStatus": {
                            app.eventBus.emit("player.status.update", change.object.playbackStatus)

                            break
                        }
                    }
                }
            })
        })
    }

    // async instanciateRealtimeAnalyzerNode() {
    //     if (this.realtimeAnalyzerNode) {
    //         return false
    //     }

    //     this.realtimeAnalyzerNode = await createRealTimeBpmProcessor(this.audioContext)

    //     this.realtimeAnalyzerNode.port.onmessage = (event) => {
    //         if (event.data.result.bpm[0]) {
    //             if (this.state.trackBPM != event.data.result.bpm[0].tempo) {
    //                 this.state.trackBPM = event.data.result.bpm[0].tempo
    //             }
    //         }

    //         if (event.data.message === "BPM_STABLE") {
    //             console.log("BPM STABLE", event.data.result)
    //         }
    //     }
    // }

    attachPlayerComponent() {
        if (this.currentDomWindow) {
            console.warn("EmbbededMediaPlayer already attached")
            return false
        }

        this.currentDomWindow = new DOMWindow({
            id: "mediaPlayer"
        })

        this.currentDomWindow.render(<EmbbededMediaPlayer />)
    }

    detachPlayerComponent() {
        if (!this.currentDomWindow) {
            console.warn("EmbbededMediaPlayer not attached")
            return false
        }

        this.currentDomWindow.close()
        this.currentDomWindow = null
    }

    destroyCurrentInstance() {
        if (!this.currentAudioInstance) {
            return false
        }

        // stop playback
        if (this.currentAudioInstance.audioElement) {
            this.currentAudioInstance.audioElement.pause()
        }

        this.currentAudioInstance = null
    }

    async createInstance(manifest) {
        if (!manifest) {
            console.error("Manifest is required")
            return false
        }

        if (typeof manifest === "string") {
            manifest = {
                src: manifest,
            }
        }

        if (!manifest.src && !manifest.source) {
            console.error("Manifest source is required")
            return false
        }

        const audioSource = manifest.src ?? manifest.source

        if (!manifest.title) {
            manifest.title = audioSource.split("/").pop()
        }

        let instanceObj = {
            audioElement: new Audio(audioSource),
            audioSource: audioSource,
            manifest: manifest,
            track: null,
            gainNode: null,
            crossfadeInterval: null,
            crossfading: false
        }

        instanceObj.audioElement.loop = this.state.playbackMode === "repeat"
        instanceObj.audioElement.crossOrigin = "anonymous"
        instanceObj.audioElement.preload = "metadata"

        const createCrossfadeInterval = () => {
            console.warn("Crossfader is not supported yet")
            return false

            const crossfadeDuration = app.cores.settings.get("player.crossfade")

            if (crossfadeDuration === 0) {
                return false
            }

            if (instanceObj.crossfadeInterval) {
                clearInterval(instanceObj.crossfadeInterval)
            }

            // fix audioElement.duration to be the duration of the audio minus the crossfade time
            const crossfadeTime = Number.parseFloat(instanceObj.audioElement.duration).toFixed(0) - crossfadeDuration

            const crossfaderTick = () => {
                // check the if current audio has reached the crossfade time
                if (instanceObj.audioElement.currentTime >= crossfadeTime) {
                    instanceObj.crossfading = true

                    this.next({
                        crossfading: crossfadeDuration,
                        instance: instanceObj
                    })

                    clearInterval(instanceObj.crossfadeInterval)
                }
            }

            crossfaderTick()

            instanceObj.crossfadeInterval = setInterval(() => {
                crossfaderTick()
            }, 1000)
        }

        // handle on end
        instanceObj.audioElement.addEventListener("ended", () => {
            // cancel if is crossfading
            if (this.state.crossfading || instanceObj.crossfading) {
                return false
            }

            this.next()
        })

        instanceObj.audioElement.addEventListener("play", () => {
            this.state.loading = false

            this.state.playbackStatus = "playing"

            instanceObj.audioElement.loop = this.state.playbackMode === "repeat"
        })

        instanceObj.audioElement.addEventListener("playing", () => {
            this.state.loading = false

            this.state.playbackStatus = "playing"

            if (this.waitUpdateTimeout) {
                clearTimeout(this.waitUpdateTimeout)
                this.waitUpdateTimeout = null
            }

            createCrossfadeInterval()
        })

        instanceObj.audioElement.addEventListener("pause", () => {
            if (this.state.crossfading || instanceObj.crossfading) {
                return false
            }

            this.state.playbackStatus = "paused"

            if (instanceObj.crossfadeInterval) {
                clearInterval(instanceObj.crossfadeInterval)
            }
        })

        instanceObj.audioElement.addEventListener("durationchange", (duration) => {
            if (instanceObj.audioElement.paused) {
                return
            }

            app.eventBus.emit("player.duration.update", duration)
        })

        instanceObj.audioElement.addEventListener("waiting", () => {
            if (instanceObj.audioElement.paused) {
                return
            }

            if (this.waitUpdateTimeout) {
                clearTimeout(this.waitUpdateTimeout)
                this.waitUpdateTimeout = null
            }

            // if takes more than 200ms to load, update loading state
            this.waitUpdateTimeout = setTimeout(() => {
                this.state.loading = true
            }, 200)
        })

        instanceObj.audioElement.addEventListener("seeked", () => {
            app.eventBus.emit("player.seek.update", instanceObj.audioElement.currentTime)
            createCrossfadeInterval()
        })

        //await this.instanciateRealtimeAnalyzerNode()

        instanceObj.track = this.audioContext.createMediaElementSource(instanceObj.audioElement)

        instanceObj.gainNode = this.audioContext.createGain()

        instanceObj.gainNode.gain.value = this.state.audioVolume

        const processorsList = [
            instanceObj.gainNode,
            ...this.audioProcessors,
        ]

        let lastProcessor = null

        processorsList.forEach((processor) => {
            if (lastProcessor) {
                lastProcessor.connect(processor)
            } else {
                instanceObj.track.connect(processor)
            }

            lastProcessor = processor
        })

        lastProcessor.connect(this.audioContext.destination)

        return instanceObj
    }

    play(instance, params = {}) {
        if (typeof instance === "number") {
            instance = this.audioQueue[instance]
        }

        if (!instance) {
            throw new Error("Audio instance is required")
        }

        if (this.audioContext.state === "suspended") {
            this.audioContext.resume()
        }

        this.currentAudioInstance = instance
        this.state.currentAudioManifest = instance.manifest

        // set time to 0
        this.currentAudioInstance.audioElement.currentTime = 0

        if (params.time >= 0) {
            this.currentAudioInstance.audioElement.currentTime = params.time
        }

        if (params.volume >= 0) {
            this.currentAudioInstance.gainNode.gain.value = params.volume
        } else {
            this.currentAudioInstance.gainNode.gain.value = this.state.audioVolume
        }

        if (this.realtimeAnalyzerNode) {
            const filter = this.audioContext.createBiquadFilter()

            filter.type = "lowpass"

            this.currentAudioInstance.track.connect(filter).connect(this.realtimeAnalyzerNode)
        }

        instance.audioElement.play()

        if (!this.currentDomWindow) {
            // FIXME: i gonna attach the player component after 500ms to avoid error calculating the player position and duration on the first play
            setTimeout(() => {
                this.attachPlayerComponent()
            }, 300)
        }
    }

    async startPlaylist(playlist, startIndex = 0) {
        // playlist is an array of audio manifests
        if (!playlist || !Array.isArray(playlist)) {
            throw new Error("Playlist is required")
        }

        this.destroyCurrentInstance()

        // clear current queue
        this.audioQueue = []

        this.audioQueueHistory = []

        this.state.loading = true

        for await (const [index, manifest] of playlist.entries()) {
            const instance = await this.createInstance(manifest)

            if (index < startIndex) {
                this.audioQueueHistory.push(instance)
            } else {
                this.audioQueue.push(instance)
            }
        }

        // play first audio
        this.play(this.audioQueue[0])
    }

    async start(manifest) {
        this.destroyCurrentInstance()

        const instance = await this.createInstance(manifest)

        this.audioQueue = [instance]

        this.audioQueueHistory = []

        this.state.loading = true

        this.play(this.audioQueue[0])
    }

    next(params = {}) {
        if (this.audioQueue.length > 0) {
            // move current audio instance to history
            this.audioQueueHistory.push(this.audioQueue.shift())
        }

        // check if there is a next audio in queue
        if (this.audioQueue.length === 0) {
            console.log("no more audio on queue, stopping playback")

            this.destroyCurrentInstance()

            this.state.playbackStatus = "stopped"
            this.state.currentAudioManifest = null

            return false
        }

        const nextParams = {}
        let nextIndex = 0

        if (params.crossfading && params.crossfading > 0 && this.state.playbackStatus === "playing" && params.instance) {
            this.state.crossfading = true

            // calculate the current audio context time with the current audio duration (subtracting time offset)
            const linearFadeoutTime = Number(
                this.audioContext.currentTime +
                Number(params.crossfading.toFixed(2))
            )

            console.log("linearFadeoutTime", this.audioContext.currentTime, linearFadeoutTime)

            console.log("crossfading offset", (this.currentAudioInstance.audioElement.duration - this.currentAudioInstance.audioElement.currentTime) - Number(params.crossfading.toFixed(2)))

            params.instance.gainNode.gain.linearRampToValueAtTime(0.00001, linearFadeoutTime)

            nextParams.volume = 0

            setTimeout(() => {
                this.state.crossfading = false
            }, params.crossfading)
        } else {
            this.destroyCurrentInstance()
        }

        // if is in shuffle mode, play a random audio
        if (this.state.playbackMode === "shuffle") {
            nextIndex = Math.floor(Math.random() * this.audioQueue.length)
        }

        // play next audio
        this.play(this.audioQueue[nextIndex], nextParams)

        if (this.state.crossfading) {
            // calculate the current audio context time (fixing times) with the crossfading duration
            const linearFadeinTime = Number(this.audioContext.currentTime + Number(params.crossfading.toFixed(2)))

            console.log("linearFadeinTime", this.audioContext.currentTime, linearFadeinTime)

            // set a linear ramp to 1
            this.currentAudioInstance.gainNode.gain.linearRampToValueAtTime(
                this.state.audioVolume,
                linearFadeinTime
            )
        }
    }

    previous() {
        this.destroyCurrentInstance()

        if (this.audioQueueHistory.length > 0) {
            // move current audio instance to queue
            this.audioQueue.unshift(this.audioQueueHistory.pop())

            // play previous audio
            this.play(this.audioQueue[0])
        }

        // check if there is a previous audio in history
        if (this.audioQueueHistory.length === 0) {
            // if there is no previous audio, start again from the first audio
            this.play(this.audioQueue[0])
        }
    }

    stop() {
        this.destroyCurrentInstance()

        this.state.playbackStatus = "stopped"
        this.state.currentAudioManifest = null

        this.audioQueue = []
    }

    toogleMute(to) {
        this.state.audioMuted = to ?? !this.state.audioMuted

        if (this.currentAudioInstance) {
            this.currentAudioInstance.audioElement.muted = this.state.audioMuted
        }

        return this.state.audioMuted
    }

    volume(volume) {
        if (typeof volume !== "number") {
            return this.state.audioVolume
        }

        if (volume > 1) {
            console.log(app.cores.settings.get("player.allowVolumeOver100"))

            if (!app.cores.settings.get("player.allowVolumeOver100")) {
                volume = 1
            }
        }

        if (volume < 0) {
            volume = 0
        }

        this.state.audioVolume = volume

        if (this.currentAudioInstance) {
            if (this.currentAudioInstance.gainNode) {
                this.currentAudioInstance.gainNode.gain.value = this.state.audioVolume
            }
        }

        return this.state.audioVolume
    }

    seek(time) {
        if (!this.currentAudioInstance) {
            return false
        }

        // if time not provided, return current time
        if (typeof time === "undefined") {
            return this.currentAudioInstance.audioElement.currentTime
        }

        // if time is provided, seek to that time
        if (typeof time === "number") {
            this.currentAudioInstance.audioElement.currentTime = time

            return time
        }
    }

    duration() {
        if (!this.currentAudioInstance) {
            return false
        }

        return this.currentAudioInstance.audioElement.duration
    }

    loop(to) {
        if (typeof to !== "boolean") {
            console.warn("Loop must be a boolean")
            return false
        }

        this.state.loop = to ?? !this.state.loop

        if (this.currentAudioInstance) {
            this.currentAudioInstance.audioElement.loop = this.state.loop
        }

        return this.state.loop
    }

    velocity(to) {
        if (typeof to !== "number") {
            console.warn("Velocity must be a number")
            return false
        }

        this.state.velocity = to

        if (this.currentAudioInstance) {
            this.currentAudioInstance.audioElement.playbackRate = this.state.velocity
        }

        return this.state.velocity
    }
}