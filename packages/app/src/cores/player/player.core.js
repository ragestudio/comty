import Core from "evite/src/core"
import EventEmitter from "evite/src/internals/EventEmitter"
import { Observable } from "object-observer"
import { FastAverageColor } from "fast-average-color"

import ToolBarPlayer from "@components/Player/ToolBarPlayer"
import BackgroundMediaPlayer from "@components/Player/BackgroundMediaPlayer"

import AudioPlayerStorage from "./player.storage"

import TrackInstanceClass from "./classes/TrackInstance"
import defaultAudioProccessors from "./processors"

import MediaSession from "./mediaSession"
import ServiceProviders from "./services"

export default class Player extends Core {
    static dependencies = [
        "api",
        "settings"
    ]

    static namespace = "player"

    static bgColor = "aquamarine"
    static textColor = "black"

    static defaultSampleRate = 48000

    static gradualFadeMs = 150

    // buffer & precomputation
    static maxManifestPrecompute = 3

    service_providers = new ServiceProviders()

    native_controls = new MediaSession()

    currentDomWindow = null

    audioContext = new AudioContext({
        sampleRate: AudioPlayerStorage.get("sample_rate") ?? Player.defaultSampleRate,
        latencyHint: "playback"
    })

    audioProcessors = []

    eventBus = new EventEmitter()

    fac = new FastAverageColor()

    track_prev_instances = []
    track_instance = null
    track_next_instances = []

    state = Observable.from({
        loading: false,
        minimized: false,

        muted: app.isMobile ? false : (AudioPlayerStorage.get("mute") ?? false),
        volume: app.isMobile ? 1 : (AudioPlayerStorage.get("volume") ?? 0.3),

        sync_mode: false,
        livestream_mode: false,
        control_locked: false,

        track_manifest: null,

        playback_mode: AudioPlayerStorage.get("mode") ?? "normal",
        playback_status: "stopped",
    })

    public = {
        audioContext: this.audioContext,
        setSampleRate: this.setSampleRate,
        start: this.start.bind(this),
        close: this.close.bind(this),
        playback: {
            mode: this.playbackMode.bind(this),
            stop: this.stop.bind(this),
            toggle: this.togglePlayback.bind(this),
            pause: this.pausePlayback.bind(this),
            play: this.resumePlayback.bind(this),
            next: this.next.bind(this),
            previous: this.previous.bind(this),
            seek: this.seek.bind(this),
        },
        _setLoading: function (to) {
            this.state.loading = !!to
        }.bind(this),
        duration: this.duration.bind(this),
        volume: this.volume.bind(this),
        mute: this.mute.bind(this),
        toggleMute: this.toggleMute.bind(this),
        seek: this.seek.bind(this),
        minimize: this.toggleMinimize.bind(this),
        collapse: this.toggleCollapse.bind(this),
        state: new Proxy(this.state, {
            get: (target, prop) => {
                return target[prop]
            },
            set: (target, prop, value) => {
                return false
            }
        }),
        eventBus: new Proxy(this.eventBus, {
            get: (target, prop) => {
                return target[prop]
            },
            set: (target, prop, value) => {
                return false
            }
        }),
        gradualFadeMs: Player.gradualFadeMs,
        trackInstance: () => {
            return this.track_instance
        }
    }

    internalEvents = {
        "player.state.update:loading": () => {
            //app.cores.sync.music.dispatchEvent("music.player.state.update", this.state)
        },
        "player.state.update:track_manifest": () => {
            //app.cores.sync.music.dispatchEvent("music.player.state.update", this.state)
        },
        "player.state.update:playback_status": () => {
            //app.cores.sync.music.dispatchEvent("music.player.state.update", this.state)
        },
        "player.seeked": (to) => {
            //app.cores.sync.music.dispatchEvent("music.player.seek", to)
        },
    }

    async onInitialize() {
        this.native_controls.initialize()

        this.initializeAudioProcessors()

        for (const [eventName, eventHandler] of Object.entries(this.internalEvents)) {
            this.eventBus.on(eventName, eventHandler)
        }

        Observable.observe(this.state, async (changes) => {
            try {
                changes.forEach((change) => {
                    if (change.type === "update") {
                        const stateKey = change.path[0]

                        this.eventBus.emit(`player.state.update:${stateKey}`, change.object[stateKey])
                        this.eventBus.emit("player.state.update", change.object)
                    }
                })
            } catch (error) {
                this.console.error(`Failed to dispatch state updater >`, error)
            }
        })
    }

    async initializeBeforeRuntimeInitialize() {
        for (const [eventName, eventHandler] of Object.entries(this.wsEvents)) {
            app.cores.api.listenEvent(eventName, eventHandler, Player.websocketListen)
        }

        if (app.isMobile) {
            this.state.audioVolume = 1
        }
    }

    async initializeAudioProcessors() {
        if (this.audioProcessors.length > 0) {
            this.console.log("Destroying audio processors")

            this.audioProcessors.forEach((processor) => {
                this.console.log(`Destroying audio processor ${processor.constructor.name}`, processor)
                processor._destroy()
            })

            this.audioProcessors = []
        }

        for await (const defaultProccessor of defaultAudioProccessors) {
            this.audioProcessors.push(new defaultProccessor(this))
        }

        for await (const processor of this.audioProcessors) {
            if (typeof processor._init === "function") {
                try {
                    await processor._init(this.audioContext)
                } catch (error) {
                    this.console.error(`Failed to initialize audio processor ${processor.constructor.name} >`, error)
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
    }

    //
    // UI Methods
    //

    attachPlayerComponent() {
        if (this.currentDomWindow) {
            this.console.warn("EmbbededMediaPlayer already attached")
            return false
        }

        if (app.layout.tools_bar) {
            this.currentDomWindow = app.layout.tools_bar.attachRender("mediaPlayer", ToolBarPlayer)
        }

    }

    detachPlayerComponent() {
        if (!this.currentDomWindow) {
            this.console.warn("EmbbededMediaPlayer not attached")
            return false
        }

        if (!app.layout.tools_bar) {
            this.console.error("Tools bar not found")
            return false
        }

        app.layout.tools_bar.detachRender("mediaPlayer")

        this.currentDomWindow = null
    }

    //
    //  Instance managing methods
    //
    async abortPreloads() {
        for await (const instance of this.track_next_instances) {
            if (instance.abortController?.abort) {
                instance.abortController.abort()
            }
        }
    }

    async preloadAudioInstance(instance) {
        const isIndex = typeof instance === "number"

        let index = isIndex ? instance : 0

        if (isIndex) {
            instance = this.track_next_instances[instance]
        }

        if (!instance) {
            this.console.error("Instance not found to preload")
            return false
        }

        if (!instance.manifest.cover_analysis) {
            const cover_analysis = await this.fac.getColorAsync(`https://corsproxy.io/?${encodeURIComponent(instance.manifest.cover ?? instance.manifest.thumbnail)}`)
                .catch((err) => {
                    this.console.error(err)

                    return false
                })

            instance.manifest.cover_analysis = cover_analysis
        }

        if (!instance._preloaded) {
            instance.audio.preload = "metadata"
            instance._preloaded = true
        }

        if (isIndex) {
            this.track_next_instances[index] = instance
        }

        return instance
    }

    async destroyCurrentInstance({ sync = false } = {}) {
        if (!this.track_instance) {
            return false
        }

        // stop playback
        if (this.track_instance.audio) {
            this.track_instance.audio.pause()
        }

        // reset track_instance
        this.track_instance = null

        // reset livestream mode
        this.state.livestream_mode = false
    }

    async attachProcessorsToInstance(instance) {
        for await (const [index, processor] of this.audioProcessors.entries()) {
            if (processor.constructor.node_bypass === true) {
                instance.contextElement.connect(processor.processor)

                processor.processor.connect(this.audioContext.destination)

                continue
            }

            if (typeof processor._attach !== "function") {
                this.console.error(`Processor ${processor.constructor.refName} not support attach`)

                continue
            }

            instance = await processor._attach(instance, index)
        }

        const lastProcessor = instance.attachedProcessors[instance.attachedProcessors.length - 1].processor

        // now attach to destination
        lastProcessor.connect(this.audioContext.destination)

        return instance
    }

    //
    // Playback methods
    //
    async play(instance, params = {}) {
        if (typeof instance === "number") {
            if (instance < 0) {
                instance = this.track_prev_instances[instance]
            }

            if (instance > 0) {
                instance = this.track_instances[instance]
            }

            if (instance === 0) {
                instance = this.track_instance
            }
        }

        if (!instance) {
            throw new Error("Audio instance is required")
        }

        if (this.audioContext.state === "suspended") {
            this.audioContext.resume()
        }

        if (this.track_instance) {
            this.track_instance = this.track_instance.attachedProcessors[this.track_instance.attachedProcessors.length - 1]._destroy(this.track_instance)

            this.destroyCurrentInstance()
        }

        // attach processors
        instance = await this.attachProcessorsToInstance(instance)

        // now set the current instance
        this.track_instance = await this.preloadAudioInstance(instance)

        // reconstruct audio src if is not set
        if (this.track_instance.audio.src !== instance.manifest.source) {
            this.track_instance.audio.src = instance.manifest.source
        }

        // set time to 0
        this.track_instance.audio.currentTime = 0

        if (params.time >= 0) {
            this.track_instance.audio.currentTime = params.time
        }

        this.track_instance.audio.muted = this.state.muted
        this.track_instance.audio.loop = this.state.playback_mode === "repeat"
        
        this.track_instance.gainNode.gain.value = this.state.volume

        // try to preload next audio
        // TODO: Use a better way to preload queues
        if (this.track_next_instances.length > 0) {
            this.preloadAudioInstance(1)
        }

        // play
        await this.track_instance.audio.play()

        this.console.debug(`Playing track >`, this.track_instance)

        // update manifest
        this.state.track_manifest = instance.manifest

        this.native_controls.update(instance.manifest)

        return this.track_instance
    }

    async start(manifest, { sync = false, time, startIndex = 0 } = {}) {
        if (this.state.control_locked && !sync) {
            this.console.warn("Controls are locked, cannot do this action")
            return false
        }

        this.attachPlayerComponent()

        // !IMPORTANT: abort preloads before destroying current instance 
        await this.abortPreloads()
        await this.destroyCurrentInstance({
            sync
        })

        this.state.loading = true

        this.track_prev_instances = []
        this.track_next_instances = []

        let playlist = Array.isArray(manifest) ? manifest : [manifest]

        if (playlist.length === 0) {
            this.console.warn(`Playlist is empty, aborting...`)
            return false
        }

        if (playlist.some((item) => typeof item === "string")) {
            playlist = await this.service_providers.resolveMany(playlist)
        }

        playlist = playlist.slice(startIndex)

        for await (const [index, _manifest] of playlist.entries()) {
            let instance = new TrackInstanceClass(this, _manifest)
            instance = await instance.initialize()

            this.track_next_instances.push(instance)

            if (index === 0) {
                this.play(this.track_next_instances[0], {
                    time: time ?? 0
                })
            }
        }

        return manifest
    }

    next({ sync = false } = {}) {
        if (this.state.control_locked && !sync) {
            //this.console.warn("Sync mode is locked, cannot do this action")
            return false
        }

        if (this.track_next_instances.length > 0) {
            // move current audio instance to history
            this.track_prev_instances.push(this.track_next_instances.shift())
        }

        if (this.track_next_instances.length === 0) {
            this.console.log(`No more tracks to play, stopping...`)

            return this.stop()
        }

        let nextIndex = 0

        if (this.state.playback_mode === "shuffle") {
            nextIndex = Math.floor(Math.random() * this.track_next_instances.length)
        }

        this.play(this.track_next_instances[nextIndex])
    }

    previous({ sync = false } = {}) {
        if (this.state.control_locked && !sync) {
            //this.console.warn("Sync mode is locked, cannot do this action")
            return false
        }

        if (this.track_prev_instances.length > 0) {
            // move current audio instance to history
            this.track_next_instances.unshift(this.track_prev_instances.pop())

            return this.play(this.track_next_instances[0])
        }

        if (this.track_prev_instances.length === 0) {
            this.console.log(`[PLAYER] No previous tracks, replying...`)
            // replay the current track
            return this.play(this.track_instance)
        }
    }

    async togglePlayback() {
        if (this.state.playback_status === "paused") {
            await this.resumePlayback()
        } else {
            await this.pausePlayback()
        }
    }

    async pausePlayback() {
        return await new Promise((resolve, reject) => {
            if (!this.track_instance) {
                this.console.error("No audio instance")
                return null
            }

            // set gain exponentially
            this.track_instance.gainNode.gain.linearRampToValueAtTime(
                0.0001,
                this.audioContext.currentTime + (Player.gradualFadeMs / 1000)
            )

            setTimeout(() => {
                this.track_instance.audio.pause()
                resolve()
            }, Player.gradualFadeMs)

            this.native_controls.updateIsPlaying(false)
        })
    }

    async resumePlayback() {
        if (!this.state.playback_status === "playing") {
            return true
        }

        return await new Promise((resolve, reject) => {
            if (!this.track_instance) {
                this.console.error("No audio instance")
                return null
            }

            // ensure audio elemeto starts from 0 volume
            this.track_instance.gainNode.gain.value = 0.0001

            this.track_instance.audio.play().then(() => {
                resolve()
            })

            // set gain exponentially
            this.track_instance.gainNode.gain.linearRampToValueAtTime(
                this.state.volume,
                this.audioContext.currentTime + (Player.gradualFadeMs / 1000)
            )

            this.native_controls.updateIsPlaying(true)
        })
    }

    stop() {
        this.destroyCurrentInstance()
        this.abortPreloads()

        this.state.playback_status = "stopped"
        this.state.track_manifest = null

        this.state.livestream_mode = false

        this.track_instance = null
        this.track_next_instances = []
        this.track_prev_instances = []

        this.native_controls.destroy()
    }

    mute(to) {
        if (app.isMobile && typeof to !== "boolean") {
            this.console.warn("Cannot mute on mobile")
            return false
        }

        if (typeof to === "boolean") {
            this.state.muted = to
            this.track_instance.audio.muted = to
        }

        return this.state.muted
    }

    volume(volume) {
        if (typeof volume !== "number") {
            return this.state.volume
        }

        if (app.isMobile) {
            this.console.warn("Cannot change volume on mobile")
            return false
        }

        if (volume > 1) {
            if (!app.cores.settings.get("player.allowVolumeOver100")) {
                volume = 1
            }
        }

        if (volume < 0) {
            volume = 0
        }

        this.state.volume = volume

        AudioPlayerStorage.set("volume", volume)

        if (this.track_instance) {
            if (this.track_instance.gainNode) {
                this.track_instance.gainNode.gain.value = this.state.volume
            }
        }

        return this.state.volume
    }

    seek(time, { sync = false } = {}) {
        if (!this.track_instance || !this.track_instance.audio) {
            return false
        }

        // if time not provided, return current time
        if (typeof time === "undefined") {
            return this.track_instance.audio.currentTime
        }

        if (this.state.control_locked && !sync) {
            this.console.warn("Sync mode is locked, cannot do this action")
            return false
        }


        // if time is provided, seek to that time
        if (typeof time === "number") {
            this.console.log(`Seeking to ${time} | Duration: ${this.track_instance.audio.duration}`)

            this.track_instance.audio.currentTime = time

            return time
        }
    }

    playbackMode(mode) {
        if (typeof mode !== "string") {
            return this.state.playback_mode
        }

        this.state.playback_mode = mode

        if (this.track_instance) {
            this.track_instance.audio.loop = this.state.playback_mode === "repeat"
        }

        AudioPlayerStorage.set("mode", mode)

        return mode
    }

    duration() {
        if (!this.track_instance) {
            return false
        }

        return this.track_instance.audio.duration
    }

    loop(to) {
        if (typeof to !== "boolean") {
            this.console.warn("Loop must be a boolean")
            return false
        }

        this.state.loop = to ?? !this.state.loop

        if (this.track_instance.audio) {
            this.track_instance.audio.loop = this.state.loop
        }

        return this.state.loop
    }

    close() {
        this.stop()
        this.detachPlayerComponent()
    }

    toggleMinimize(to) {
        this.state.minimized = to ?? !this.state.minimized

        if (this.state.minimized) {
            app.layout.sidebar.attachBottomItem("player", BackgroundMediaPlayer, {
                noContainer: true
            })
        } else {
            app.layout.sidebar.removeBottomItem("player")
        }

        return this.state.minimized
    }

    toggleCollapse(to) {
        if (typeof to !== "boolean") {
            this.console.warn("Collapse must be a boolean")
            return false
        }

        this.state.collapsed = to ?? !this.state.collapsed

        return this.state.collapsed
    }

    toggleSyncMode(to, lock) {
        if (typeof to !== "boolean") {
            this.console.warn("Sync mode must be a boolean")
            return false
        }

        this.state.syncMode = to ?? !this.state.syncMode

        this.state.syncModeLocked = lock ?? false

        this.console.log(`Sync mode is now ${this.state.syncMode ? "enabled" : "disabled"} | Locked: ${this.state.syncModeLocked ? "yes" : "no"}`)

        return this.state.syncMode
    }

    toggleMute(to) {
        if (typeof to !== "boolean") {
            to = !this.state.muted
        }

        return this.mute(to)
    }

    async setSampleRate(to) {
        // must be a integer
        if (typeof to !== "number") {
            this.console.error("Sample rate must be a number")
            return this.audioContext.sampleRate
        }

        // must be a integer
        if (!Number.isInteger(to)) {
            this.console.error("Sample rate must be a integer")
            return this.audioContext.sampleRate
        }

        return await new Promise((resolve, reject) => {
            app.confirm({
                title: "Change sample rate",
                content: `To change the sample rate, the app needs to be reloaded. Do you want to continue?`,
                onOk: () => {
                    try {
                        this.audioContext = new AudioContext({ sampleRate: to })

                        AudioPlayerStorage.set("sample_rate", to)

                        app.navigation.reload()

                        return resolve(this.audioContext.sampleRate)
                    } catch (error) {
                        app.message.error(`Failed to change sample rate, ${error.message}`)
                        return resolve(this.audioContext.sampleRate)
                    }
                },
                onCancel: () => {
                    return resolve(this.audioContext.sampleRate)
                }
            })
        })
    }
}