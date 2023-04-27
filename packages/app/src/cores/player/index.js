import React from "react"
import Core from "evite/src/core"
import { Observable } from "object-observer"
import AudioPlayerStorage from "./storage"
import { FastAverageColor } from "fast-average-color"

import EmbbededMediaPlayer from "components/EmbbededMediaPlayer"
import BackgroundMediaPlayer from "components/BackgroundMediaPlayer"

import { DOMWindow } from "components/RenderWindow"

import GainProcessorNode from "./processors/gainNode"
import CompressorProcessorNode from "./processors/compressorNode"

// TODO: Check if source playing is a stream. Also handle if it's a stream resuming after a pause will seek to the last position
export default class Player extends Core {
    static refName = "player"

    static namespace = "player"

    currentDomWindow = null

    audioContext = new AudioContext()

    static maxBufferLoadQueue = 2

    bufferLoadQueue = []
    bufferLoadQueueLoading = false

    audioQueueHistory = []
    audioQueue = []
    audioProcessors = [
        new GainProcessorNode(this),
        new CompressorProcessorNode(this),
    ]

    currentAudioInstance = null

    fac = new FastAverageColor()

    state = Observable.from({
        loading: false,
        minimized: false,
        audioMuted: AudioPlayerStorage.get("mute") ?? false,
        playbackMode: AudioPlayerStorage.get("mode") ?? "repeat",
        audioVolume: AudioPlayerStorage.get("volume") ?? 0.3,
        velocity: AudioPlayerStorage.get("velocity") ?? 1,

        coverColorAnalysis: null,
        currentAudioManifest: null,
        playbackStatus: "stopped",
        crossfading: false,
        trackBPM: 0,
        livestream: false,
    })

    public = {
        audioContext: this.audioContext,
        attachPlayerComponent: this.attachPlayerComponent.bind(this),
        detachPlayerComponent: this.detachPlayerComponent.bind(this),
        toogleMute: this.toogleMute.bind(this),
        minimize: this.toogleMinimize.bind(this),
        volume: this.volume.bind(this),
        start: this.start.bind(this),
        startPlaylist: this.startPlaylist.bind(this),
        attachProcessor: function (name) {

        }.bind(this),
        dettachProcessor: async function (name) {
            // find the processor by refName
            const processor = this.currentAudioInstance.attachedProcessors.find((_processor) => {
                return _processor.constructor.refName === name
            })

            if (!processor) {
                throw new Error("Processor not found")
            }

            if (typeof processor._detach !== "function") {
                throw new Error("Processor does not support detach")
            }

            return this.currentAudioInstance = await processor._detach(this.currentAudioInstance)
        }.bind(this),
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
        close: this.close.bind(this),
    }

    async onInitialize() {
        // initialize all audio processors
        for await (const processor of this.audioProcessors) {
            console.log(`Initializing audio processor ${processor.constructor.name}`, processor)

            if (typeof processor._init === "function") {
                try {
                    await processor._init(this.audioContext)
                } catch (error) {
                    console.error(`Failed to initialize audio processor ${processor.constructor.name} >`, error)
                    continue
                }
            }

            // check if processor has exposed public methods
            if (processor.exposeToPublic) {
                Object.entries(processor.exposeToPublic).forEach(([key, value]) => {
                    const refName = processor.constructor.refName

                    if (typeof this.public[refName] === "undefined") {
                        // by default create a empty object
                        this.public[refName] = {}
                    }

                    this.public[refName][key] = value
                })
            }
        }

        Observable.observe(this.state, (changes) => {
            changes.forEach((change) => {
                if (change.type === "update") {
                    switch (change.path[0]) {
                        case "livestream": {
                            app.eventBus.emit("player.livestream.update", change.object.livestream)

                            break
                        }
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

                            if (change.object.currentAudioManifest) {
                                // analyze cover color

                                if (change.object.currentAudioManifest.thumbnail) {
                                    this.fac.getColorAsync(change.object.currentAudioManifest.thumbnail)
                                        .then((color) => {
                                            this.state.coverColorAnalysis = color
                                        })
                                        .catch((err) => {
                                            console.error(err)
                                        })
                                }
                            }

                            break
                        }
                        case "coverColorAnalysis": {
                            app.eventBus.emit("player.coverColorAnalysis.update", change.object.coverColorAnalysis)

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
                        case "minimized": {
                            if (change.object.minimized) {
                                app.SidebarController.attachBottomItem("player", BackgroundMediaPlayer, {
                                    noContainer: true
                                })
                            } else {
                                app.SidebarController.removeBottomItem("player")
                            }

                            app.eventBus.emit("player.minimized.update", change.object.minimized)

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

        this.currentDomWindow.render(React.createElement(EmbbededMediaPlayer))
    }

    detachPlayerComponent() {
        if (!this.currentDomWindow) {
            console.warn("EmbbededMediaPlayer not attached")
            return false
        }

        this.currentDomWindow.destroy()
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

        // reset livestream mode
        this.state.livestream = false
    }

    enqueueLoadBuffer(audioElement) {
        if (!audioElement) {
            console.error("Audio element is required")
            return false
        }

        if (audioElement instanceof Audio) {
            this.bufferLoadQueue.push(audioElement)
        }

        if (!this.bufferLoadQueueLoading) {
            this.bufferLoadQueueLoading = true

            this.loadNextQueueBuffer()
        }
    }

    async loadNextQueueBuffer() {
        if (!this.bufferLoadQueue.length) {
            this.bufferLoadQueueLoading = false

            return false
        }

        if (this.bufferLoadQueueLoading >= Player.maxBufferLoadQueue) {
            return false
        }

        const audioElement = this.bufferLoadQueue.shift()

        if (audioElement.signal.aborted) {
            console.warn("Aborted audio element")

            this.bufferLoadQueueLoading = false

            this.loadNextQueueBuffer()

            return false
        }

        this.bufferLoadQueueLoading = true

        const preloadPromise = () => new Promise((resolve, reject) => {
            audioElement.addEventListener("canplaythrough", () => {
                resolve()
            }, { once: true })

            console.log("Preloading audio buffer", audioElement.src)

            audioElement.load()
        })

        await preloadPromise()

        this.bufferLoadQueueLoading = false

        this.loadNextQueueBuffer()

        return true
    }

    async createInstance(manifest) {
        if (!manifest) {
            console.error("Manifest is required")
            return false
        }

        if (typeof manifest === "string") {
            manifest = {
                src: manifest,
                stream: false,
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
            abortController: new AbortController(),
            audioElement: new Audio(audioSource),
            audioSource: audioSource,
            manifest: manifest,
            track: null,
            gainNode: null,
            crossfadeInterval: null,
            crossfading: false,
            attachedProcessors: [],
        }

        instanceObj.audioElement.signal = instanceObj.abortController.signal
        instanceObj.audioElement.loop = this.state.playbackMode === "repeat"
        instanceObj.audioElement.crossOrigin = "anonymous"
        instanceObj.audioElement.preload = "none"

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

        // detect if the audio is a live stream
        instanceObj.audioElement.addEventListener("loadedmetadata", () => {
            if (instanceObj.audioElement.duration === Infinity) {
                instanceObj.manifest.stream = true
            }
        })

        //this.enqueueLoadBuffer(instanceObj.audioElement)

        // create media element source as first node
        instanceObj.track = this.audioContext.createMediaElementSource(instanceObj.audioElement)

        return instanceObj
    }

    async play(instance, params = {}) {
        if (typeof instance === "number") {
            instance = this.audioQueue[instance]
        }

        if (!instance) {
            throw new Error("Audio instance is required")
        }

        if (this.audioContext.state === "suspended") {
            this.audioContext.resume()
        }

        if (!this.currentDomWindow) {
            this.attachPlayerComponent()
        }

        this.currentAudioInstance = instance
        this.state.currentAudioManifest = instance.manifest

        for await (const [index, processor] of this.audioProcessors.entries()) {
            if (typeof processor._attach !== "function") {
                console.error(`Processor ${processor.constructor.refName} not support attach`)

                continue
            }

            this.currentAudioInstance = await processor._attach(this.currentAudioInstance, index)
        }

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

        instance.audioElement.muted = this.state.audioMuted

        instance.audioElement.load()

        instance.audioElement.play()

        // check if the audio is a live stream when metadata is loaded
        instance.audioElement.addEventListener("loadedmetadata", () => {
            console.log("loadedmetadata", instance.audioElement.duration)

            if (instance.audioElement.duration === Infinity) {
                instance.manifest.stream = true

                this.state.livestream = true
            }

            // enqueue preload next audio
            if (this.audioQueue.length > 1) {
                const nextAudio = this.audioQueue[1]

                this.enqueueLoadBuffer(nextAudio.audioElement)
            }
        }, { once: true })
    }

    async startPlaylist(playlist, startIndex = 0) {
        // playlist is an array of audio manifests
        if (!playlist || !Array.isArray(playlist)) {
            throw new Error("Playlist is required")
        }

        // !IMPORTANT: abort preloads before destroying current instance 
        await this.abortPreloads()

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
        // !IMPORTANT: abort preloads before destroying current instance 
        await this.abortPreloads()

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

    async abortPreloads() {
        for await (const instance of this.audioQueue) {
            if (instance.abortController?.abort) {
                instance.abortController.abort()
            }
        }

        // clear load buffer audio queue
        this.loadBufferAudioQueue = []
        this.bufferLoadQueueLoading = false
    }

    stop() {
        this.destroyCurrentInstance()

        this.abortPreloads()

        this.state.playbackStatus = "stopped"
        this.state.currentAudioManifest = null

        this.state.livestream = false

        this.audioQueue = []
    }

    close() {
        this.stop()
        this.detachPlayerComponent()
    }

    toogleMute(to) {
        this.state.audioMuted = to ?? !this.state.audioMuted

        if (this.currentAudioInstance) {
            this.currentAudioInstance.audioElement.muted = this.state.audioMuted
        }

        return this.state.audioMuted
    }

    toogleMinimize(to) {
        this.state.minimized = to ?? !this.state.minimized

        return this.state.minimized
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

    collapse(to) {
        if (typeof to !== "boolean") {
            console.warn("Collapse must be a boolean")
            return false
        }

        this.state.collapsed = to ?? !this.state.collapsed

        return this.state.collapsed
    }
}