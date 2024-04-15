import Core from "evite/src/core"
import EventEmitter from "evite/src/internals/EventEmitter"
import { Observable } from "object-observer"
import { FastAverageColor } from "fast-average-color"

import MusicModel from "comty.js/models/music"

import ToolBarPlayer from "components/Player/ToolBarPlayer"
import BackgroundMediaPlayer from "components/Player/BackgroundMediaPlayer"

import AudioPlayerStorage from "./player.storage"

import defaultAudioProccessors from "./processors"

import MediaSession from "./mediaSession"
import ServicesHandlers from "./services"

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
        toggleCurrentTrackLike: this.toggleCurrentTrackLike.bind(this),
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
        })
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

    wsEvents = {

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
            this.console.log(`Initializing audio processor ${processor.constructor.name}`, processor)

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
            instance.media.preload = "metadata"
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
        if (this.track_instance.media) {
            this.track_instance.media.pause()
        }

        // reset track_instance
        this.track_instance = null

        // reset livestream mode
        this.state.livestream_mode = false
    }

    async createInstance(manifest) {
        if (!manifest) {
            this.console.error("Manifest is required")
            return false
        }

        if (typeof manifest === "string") {
            manifest = {
                src: manifest,
            }
        }

        // check if manifest has `manifest` property, if is and not inherit or missing source, resolve
        if (manifest.service) {
            if (!ServicesHandlers[manifest.service]) {
                this.console.error(`Service ${manifest.service} is not supported`)
                return false
            }

            if (manifest.service !== "inherit" && !manifest.source) {
                const resolver = ServicesHandlers[manifest.service].resolve

                if (!resolver) {
                    this.console.error(`Resolving for service [${manifest.service}] is not supported`)
                    return false
                }

                manifest = await resolver(manifest)
            }
        }

        if (!manifest.src && !manifest.source) {
            this.console.error("Manifest source is required")
            return false
        }

        const source = manifest.src ?? manifest.source

        if (!manifest.metadata) {
            manifest.metadata = {}
        }

        // if title is not set, use the audio source filename
        if (!manifest.metadata.title) {
            manifest.metadata.title = source.split("/").pop()
        }

        let instance = {
            manifest: manifest,
            attachedProcessors: [],
            abortController: new AbortController(),
            source: source,
            media: new Audio(source),
            duration: null,
            seek: 0,
            track: null,
        }

        instance.media.signal = instance.abortController.signal
        instance.media.crossOrigin = "anonymous"
        instance.media.preload = "none"

        instance.media.loop = this.state.playback_mode === "repeat"
        instance.media.volume = this.state.volume

        // handle on end
        instance.media.addEventListener("ended", () => {
            this.next()
        })

        instance.media.addEventListener("loadeddata", () => {
            this.state.loading = false
        })

        // update playback status
        instance.media.addEventListener("play", () => {
            this.state.playback_status = "playing"
        })

        instance.media.addEventListener("playing", () => {
            this.state.loading = false

            this.state.playback_status = "playing"

            if (this.waitUpdateTimeout) {
                clearTimeout(this.waitUpdateTimeout)
                this.waitUpdateTimeout = null
            }
        })

        instance.media.addEventListener("pause", () => {
            this.state.playback_status = "paused"
        })

        instance.media.addEventListener("durationchange", (duration) => {
            if (instance.media.paused) {
                return false
            }

            instance.duration = duration
        })

        instance.media.addEventListener("waiting", () => {
            if (instance.media.paused) {
                return false
            }

            if (this.waitUpdateTimeout) {
                clearTimeout(this.waitUpdateTimeout)
                this.waitUpdateTimeout = null
            }

            // if takes more than 150ms to load, update loading state
            this.waitUpdateTimeout = setTimeout(() => {
                this.state.loading = true
            }, 150)
        })

        instance.media.addEventListener("seeked", () => {
            instance.seek = instance.media.currentTime

            if (this.state.sync_mode) {
                // useMusicSync("music:player:seek", {
                //     position: instance.seek,
                //     state: this.state,
                // })
            }

            this.eventBus.emit(`player.seeked`, instance.seek)
        })

        instance.media.addEventListener("loadedmetadata", () => {
            if (instance.media.duration === Infinity) {
                instance.manifest.stream = true

                this.state.livestream_mode = true
            }
        }, { once: true })

        instance.track = this.audioContext.createMediaElementSource(instance.media)

        return instance
    }

    async attachProcessorsToInstance(instance) {
        for await (const [index, processor] of this.audioProcessors.entries()) {
            if (processor.constructor.node_bypass === true) {
                instance.track.connect(processor.processor)

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
        if (this.track_instance.media.src !== instance.source) {
            this.track_instance.media.src = instance.source
        }

        // set time to 0
        this.track_instance.media.currentTime = 0

        if (params.time >= 0) {
            this.track_instance.media.currentTime = params.time
        }

        if (params.volume >= 0) {
            this.track_instance.gainNode.gain.value = params.volume
        } else {
            this.track_instance.gainNode.gain.value = this.state.volume
        }

        this.track_instance.media.muted = this.state.muted
        this.track_instance.media.loop = this.state.playback_mode === "repeat"

        // try to preload next audio
        if (this.track_next_instances.length > 0) {
            this.preloadAudioInstance(1)
        }

        // play
        await this.track_instance.media.play()

        this.console.log(this.track_instance)

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

        const isPlaylist = Array.isArray(manifest)

        if (isPlaylist) {
            let playlist = manifest

            if (playlist.length === 0) {
                this.console.warn(`[PLAYER] Playlist is empty, aborting...`)
                return false
            }

            if (playlist.some((item) => typeof item === "string")) {
                this.console.log("Resolving missing manifests by ids...")
                playlist = await ServicesHandlers.default.resolveMany(playlist)
            }

            playlist = playlist.slice(startIndex)

            for await (const [index, _manifest] of playlist.entries()) {
                const instance = await this.createInstance(_manifest)

                this.track_next_instances.push(instance)

                if (index === 0) {
                    this.play(this.track_next_instances[0], {
                        time: time ?? 0
                    })
                }
            }

            return playlist
        }

        const instance = await this.createInstance(manifest)

        this.track_next_instances.push(instance)

        this.play(this.track_next_instances[0], {
            time: time ?? 0
        })

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
            this.console.log(`[PLAYER] No more tracks to play, stopping...`)

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
                this.track_instance.media.pause()
                resolve()
            }, Player.gradualFadeMs)

            this.native_controls.updateIsPlaying(false)
        })
    }

    async resumePlayback() {
        return await new Promise((resolve, reject) => {
            if (!this.track_instance) {
                this.console.error("No audio instance")
                return null
            }

            // ensure audio elemeto starts from 0 volume
            this.track_instance.gainNode.gain.value = 0.0001

            this.track_instance.media.play().then(() => {
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
            this.track_instance.media.muted = to
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
        if (!this.track_instance || !this.track_instance.media) {
            return false
        }

        // if time not provided, return current time
        if (typeof time === "undefined") {
            return this.track_instance.media.currentTime
        }

        if (this.state.control_locked && !sync) {
            this.console.warn("Sync mode is locked, cannot do this action")
            return false
        }

        // if time is provided, seek to that time
        if (typeof time === "number") {
            this.track_instance.media.currentTime = time

            return time
        }
    }

    playbackMode(mode) {
        if (typeof mode !== "string") {
            return this.state.playback_mode
        }

        this.state.playback_mode = mode

        if (this.track_instance) {
            this.track_instance.media.loop = this.state.playback_mode === "repeat"
        }

        AudioPlayerStorage.set("mode", mode)

        return mode
    }

    duration() {
        if (!this.track_instance) {
            return false
        }

        return this.track_instance.media.duration
    }

    loop(to) {
        if (typeof to !== "boolean") {
            this.console.warn("Loop must be a boolean")
            return false
        }

        this.state.loop = to ?? !this.state.loop

        if (this.track_instance.media) {
            this.track_instance.media.loop = this.state.loop
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

    async getTracksByIds(list) {
        if (!Array.isArray(list)) {
            this.console.warn("List must be an array")
            return false
        }

        let ids = []

        list.forEach((item) => {
            if (typeof item === "string") {
                ids.push(item)
            }
        })

        if (ids.length === 0) {
            return list
        }

        const fetchedTracks = await MusicModel.getTracksData(ids).catch((err) => {
            this.console.error(err)
            return false
        })

        if (!fetchedTracks) {
            return list
        }

        // replace fetched tracks with the ones in the list
        fetchedTracks.forEach((fetchedTrack) => {
            const index = list.findIndex((item) => item === fetchedTrack._id)

            if (index !== -1) {
                list[index] = fetchedTrack
            }
        })

        return list
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

    async toggleCurrentTrackLike(to, manifest) {
        let isCurrent = !!!manifest

        if (typeof manifest === "undefined") {
            manifest = this.track_instance.manifest
        }

        if (!manifest) {
            this.console.error("Track instance or manifest not found")
            return false
        }

        if (typeof to !== "boolean") {
            this.console.warn("Like must be a boolean")
            return false
        }

        const service = manifest.service ?? "default"

        if (!ServicesHandlers[service].toggleLike) {
            this.console.error(`Service [${service}] does not support like actions`)
            return false
        }

        const result = await ServicesHandlers[service].toggleLike(manifest, to)

        if (isCurrent) {
            this.track_instance.manifest.liked = to
            this.state.track_manifest.liked = to
        }

        return result
    }
}