import Core from "evite/src/core"
import { Observable } from "object-observer"
import { FastAverageColor } from "fast-average-color"
import { CapacitorMusicControls } from 'capacitor-music-controls-plugin-v3'

//import { LRUCache } from "lru-cache/dist/mjs/index"

import PlaylistModel from "comty.js/models/playlists"

import EmbbededMediaPlayer from "components/Player/MediaPlayer"
import BackgroundMediaPlayer from "components/Player/BackgroundMediaPlayer"

import AudioPlayerStorage from "./storage"

import EqProcessorNode from "./processors/eqNode"
import GainProcessorNode from "./processors/gainNode"
import CompressorProcessorNode from "./processors/compressorNode"

function useMusicSync(event, data) {
    const currentRoomData = app.cores.sync.music.currentRoomData()

    if (!currentRoomData) {
        console.warn("No room data available")
        return false
    }

    return app.cores.sync.music.dispatchEvent(event, data)
}

// this is the time tooks to fade in/out the volume when playing/pausing
const gradualFadeMs = 150

const defaultAudioProccessors = [
    EqProcessorNode,
    GainProcessorNode,
    CompressorProcessorNode,
]

class MediaSession {
    initialize() {
        CapacitorMusicControls.addListener("controlsNotification", (info) => {
            console.log(info)

            this.handleControlsEvent(info)
        })

        // ANDROID (13, see bug above as to why it's necessary)
        document.addEventListener("controlsNotification", (event) => {
            console.log(event)

            const info = { message: event.message, position: 0 }

            this.handleControlsEvent(info)
        })
    }

    update(manifest) {
        if ("mediaSession" in navigator) {
            return navigator.mediaSession.metadata = new MediaMetadata({
                title: manifest.title,
                artist: manifest.artist,
                album: manifest.album,
                artwork: [
                    {
                        src: manifest.cover ?? manifest.thumbnail,
                        sizes: "512x512",
                        type: "image/jpeg",
                    }
                ],
            })
        }

        return CapacitorMusicControls.create({
            track: manifest.title,
            artist: manifest.artist,
            album: manifest.album,
            cover: manifest.cover,

            hasPrev: false,
            hasNext: false,
            hasClose: true,

            isPlaying: true,
            dismissable: false,

            playIcon: "media_play",
            pauseIcon: "media_pause",
            prevIcon: "media_prev",
            nextIcon: "media_next",
            closeIcon: "media_close",
            notificationIcon: "notification"
        })
    }

    updateIsPlaying(to, timeElapsed = 0) {
        if ("mediaSession" in navigator) {
            return navigator.mediaSession.playbackState = to ? "playing" : "paused"
        }

        return CapacitorMusicControls.updateIsPlaying({
            isPlaying: to,
            elapsed: timeElapsed,
        })
    }

    destroy() {
        if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "none"
        }

        this.active = false

        return CapacitorMusicControls.destroy()
    }

    handleControlsEvent(action) {
        const message = action.message

        switch (message) {
            case "music-controls-next": {
                return app.cores.player.playback.next()
            }
            case "music-controls-previous": {
                return app.cores.player.playback.previous()
            }
            case "music-controls-pause": {
                return app.cores.player.playback.pause()
            }
            case "music-controls-play": {
                return app.cores.player.playback.play()
            }
            case "music-controls-destroy": {
                return app.cores.player.playback.stop()
            }

            // External controls (iOS only)
            case "music-controls-toggle-play-pause": {
                return app.cores.player.playback.toggle()
            }

            // Headset events (Android only)
            // All media button events are listed below
            case "music-controls-media-button": {
                return app.cores.player.playback.toggle()
            }
            case "music-controls-headset-unplugged": {
                return app.cores.player.playback.pause()
            }
            case "music-controls-headset-plugged": {
                return app.cores.player.playback.play()
            }
            default:
                break;
        }
    }
}

// TODO: Check if source playing is a stream. Also handle if it's a stream resuming after a pause will seek to the last position
export default class Player extends Core {
    static dependencies = [
        "api",
        "settings"
    ]

    static websocketListen = "music"

    static refName = "player"

    static namespace = "player"

    // default statics
    static maxBufferLoadQueue = 2

    static defaultSampleRate = 48000

    native_controls = new MediaSession()

    currentDomWindow = null

    audioContext = new AudioContext({
        sampleRate: AudioPlayerStorage.get("sample_rate") ?? Player.defaultSampleRate,
        latencyHint: "playback"
    })

    bufferLoadQueue = []
    bufferLoadQueueLoading = false

    audioQueueHistory = []
    audioQueue = []
    audioProcessors = []

    currentAudioInstance = null

    fac = new FastAverageColor()

    state = Observable.from({
        loading: false,
        minimized: false,
        audioMuted: app.isMobile ? false : (AudioPlayerStorage.get("mute") ?? false),
        playbackMode: AudioPlayerStorage.get("mode") ?? "repeat",
        audioVolume: app.isMobile ? 1 : (AudioPlayerStorage.get("volume") ?? 0.3),
        velocity: AudioPlayerStorage.get("velocity") ?? 1,

        coverColorAnalysis: null,
        currentAudioManifest: null,
        playbackStatus: "stopped",
        livestream: false,
        syncMode: false,
        syncModeLocked: false,
        startingNew: false,
        liked: false,
    })

    public = {
        audioContext: this.audioContext,
        attachPlayerComponent: this.attachPlayerComponent.bind(this),
        detachPlayerComponent: this.detachPlayerComponent.bind(this),
        toggleMute: this.toggleMute.bind(this),
        minimize: this.toggleMinimize.bind(this),
        volume: this.volume.bind(this),
        start: this.start.bind(this),
        startPlaylist: this.startPlaylist.bind(this),
        isIdCurrent: function (id) {
            console.log("isIdCurrent", id, this.state.currentAudioManifest?._id === id)

            return this.state.currentAudioManifest?._id === id
        }.bind(this),
        isIdPlaying: function (id) {
            return this.public.isIdCurrent(id) && this.state.playbackStatus === "playing"
        }.bind(this),
        attachProcessor: function (name) {
            // find the processor by refName
            const processor = this.audioProcessors.find((_processor) => {
                return _processor.constructor.refName === name
            })

            if (!processor) {
                throw new Error("Processor not found")
            }

            if (typeof processor._attach !== "function") {
                throw new Error("Processor does not support attach")
            }

            this.currentAudioInstance = processor._attach(this.currentAudioInstance)

            // attach last one to the destination
            //this.currentAudioInstance.attachedProcessors[this.currentAudioInstance.attachedProcessors.length - 1].processor.connect(this.audioContext.destination)
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
            toggle: function () {
                if (!this.currentAudioInstance) {
                    console.error("No audio instance")
                    return null
                }

                if (this.state.syncModeLocked) {
                    console.warn("Sync mode is locked, cannot do this action")
                    return false
                }

                if (this.currentAudioInstance.audioElement.paused) {
                    this.resumePlayback()
                } else {
                    this.pausePlayback()
                }
            }.bind(this),
            play: this.resumePlayback.bind(this),
            pause: this.pausePlayback.bind(this),
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
        toggleCurrentTrackLike: this.toggleCurrentTrackLike.bind(this),
        seek: this.seek.bind(this),
        duration: this.duration.bind(this),
        velocity: this.velocity.bind(this),
        close: this.close.bind(this),
        toggleSyncMode: this.toggleSyncMode.bind(this),
        currentState: this.currentState.bind(this),
        setSampleRate: this.setSampleRate.bind(this),
    }

    wsEvents = {
        "music:self:track:toggle:like": (data) => {
            const to = data.action === "liked"

            if (this.state.liked !== to) {
                this.state.liked = to
            }
        }
    }

    async initializeAudioProcessors() {
        if (this.audioProcessors.length > 0) {
            console.log("Destroying audio processors")

            this.audioProcessors.forEach((processor) => {
                console.log(`Destroying audio processor ${processor.constructor.name}`, processor)
                processor._destroy()
            })

            this.audioProcessors = []
        }

        for await (const defaultProccessor of defaultAudioProccessors) {
            this.audioProcessors.push(new defaultProccessor(this))
        }

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
    }

    observeStateChanges() {
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

                            break
                        }
                        case "loading": {
                            app.eventBus.emit("player.loading.update", change.object.loading)

                            if (this.state.syncMode) {
                                useMusicSync("music:player:loading", {
                                    loading: change.object.loading,
                                    state: this.currentState()
                                })
                            }

                            break
                        }
                        case "currentAudioManifest": {
                            app.eventBus.emit("player.current.update", change.object.currentAudioManifest)

                            if (change.object.currentAudioManifest) {
                                // analyze cover color

                                if (change.object.currentAudioManifest.cover || change.object.currentAudioManifest.thumbnail) {
                                    this.fac.getColorAsync(change.object.currentAudioManifest.cover ?? change.object.currentAudioManifest.thumbnail)
                                        .then((color) => {
                                            this.state.coverColorAnalysis = color
                                        })
                                        .catch((err) => {
                                            console.error(err)
                                        })
                                }
                            }

                            if (this.state.syncMode) {
                                useMusicSync("music:player:start", {
                                    manifest: change.object.currentAudioManifest,
                                    state: this.currentState()
                                })
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

                            if (this.state.syncMode) {
                                if (this.state.loading) {
                                    return false
                                }

                                useMusicSync("music:player:status", {
                                    status: change.object.playbackStatus,
                                    time: this.currentAudioInstance.audioElement.currentTime,
                                    duration: this.currentAudioInstance.audioElement.duration,
                                    startingNew: this.state.startingNew,
                                    state: this.currentState(),
                                })
                            }

                            break
                        }
                        case "minimized": {
                            if (change.object.minimized) {
                                app.layout.sidebar.attachBottomItem("player", BackgroundMediaPlayer, {
                                    noContainer: true
                                })
                            } else {
                                app.layout.sidebar.removeBottomItem("player")
                            }

                            app.eventBus.emit("player.minimized.update", change.object.minimized)

                            break
                        }
                        case "syncModeLocked": {
                            app.eventBus.emit("player.syncModeLocked.update", change.object.syncModeLocked)
                            break
                        }
                        case "syncMode": {
                            app.eventBus.emit("player.syncMode.update", change.object.syncMode)
                            break
                        }
                        case "liked": {
                            app.eventBus.emit("player.toggle.like", change.object.liked)
                            break
                        }
                    }
                }
            })
        })
    }

    async onInitialize() {
        this.initializeAudioProcessors()
        this.observeStateChanges()
        this.native_controls.initialize()
    }

    async initializeBeforeRuntimeInitialize() {
        for (const [eventName, eventHandler] of Object.entries(this.wsEvents)) {
            app.cores.api.listenEvent(eventName, eventHandler, Player.websocketListen)
        }

        if (app.isMobile) {
            this.state.audioVolume = 1
        }
    }

    //
    // UI Methods
    //

    async toggleCurrentTrackLike() {
        if (!this.currentAudioInstance) {
            console.error("No track playing")
            return false
        }

        const currentId = this.currentAudioInstance.manifest._id

        const result = await PlaylistModel.toggleTrackLike(currentId).catch((err) => {
            return null
        })

        if (result) {
            this.state.liked = result.action === "liked"
        }
    }

    attachPlayerComponent() {
        if (this.currentDomWindow) {
            console.warn("EmbbededMediaPlayer already attached")
            return false
        }

        if (!app.layout.floatingStack) {
            console.error("Floating stack not found")
            return false
        }

        this.currentDomWindow = app.layout.floatingStack.add("mediaPlayer", EmbbededMediaPlayer)
    }

    detachPlayerComponent() {
        if (!this.currentDomWindow) {
            console.warn("EmbbededMediaPlayer not attached")
            return false
        }

        if (!app.layout.floatingStack) {
            console.error("Floating stack not found")
            return false
        }

        app.layout.floatingStack.remove("mediaPlayer")

        this.currentDomWindow = null
    }

    //
    // Buffer methods
    //

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

    //
    //  Instance managing methods
    //

    async destroyCurrentInstance({ sync = false } = {}) {
        if (!this.currentAudioInstance) {
            return false
        }

        // stop playback
        if (this.currentAudioInstance.audioElement) {
            this.currentAudioInstance.audioElement.srcObj = null
            this.currentAudioInstance.audioElement.src = null

            // if is in sync mode, just seek to last position to stop playback and avoid sync issues
            this.currentAudioInstance.audioElement.pause()
        }

        this.currentAudioInstance = null

        // reset livestream mode
        this.state.livestream = false
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

        const source = manifest.src ?? manifest.source

        // if title is not set, use the audio source filename
        if (!manifest.title) {
            manifest.title = source.split("/").pop()
        }

        let instanceObj = {
            abortController: new AbortController(),
            audioElement: new Audio(source),
            media: null,
            source: source,
            manifest: manifest,
            attachedProcessors: [],
        }

        instanceObj.audioElement.signal = instanceObj.abortController.signal
        instanceObj.audioElement.loop = this.state.playbackMode === "repeat"
        instanceObj.audioElement.crossOrigin = "anonymous"
        instanceObj.audioElement.preload = "none"

        // handle on end
        instanceObj.audioElement.addEventListener("ended", () => {
            // if is in sync locked mode, do noting
            if (this.state.syncModeLocked) {
                return false
            }

            this.next()
        })

        instanceObj.audioElement.addEventListener("play", () => {
            this.state.playbackStatus = "playing"

            instanceObj.audioElement.loop = this.state.playbackMode === "repeat"
        })

        instanceObj.audioElement.addEventListener("loadeddata", () => {
            this.state.loading = false

            console.log("Loaded audio data", instanceObj.audioElement.src)
        })

        instanceObj.audioElement.addEventListener("playing", () => {
            this.state.loading = false

            this.state.playbackStatus = "playing"

            if (this.state.startingNew) {
                this.state.startingNew = false
            }

            if (this.waitUpdateTimeout) {
                clearTimeout(this.waitUpdateTimeout)
                this.waitUpdateTimeout = null
            }
        })

        instanceObj.audioElement.addEventListener("pause", () => {
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

            if (this.state.syncMode) {
                useMusicSync("music:player:seek", {
                    position: instanceObj.audioElement.currentTime,
                    state: this.currentState(),
                })
            }
        })

        // // detect if the audio is a live stream
        // instanceObj.audioElement.addEventListener("loadedmetadata", () => {
        //     if (instanceObj.audioElement.duration === Infinity) {
        //         instanceObj.manifest.stream = true
        //     }
        // })

        //this.enqueueLoadBuffer(instanceObj.audioElement)

        instanceObj.media = this.audioContext.createMediaElementSource(instanceObj.audioElement)

        // storage media data on browser cache to improve performance
        instanceObj.media.data = instanceObj.audioElement

        return instanceObj
    }

    async attachProcessorsToInstance(instance) {
        for await (const [index, processor] of this.audioProcessors.entries()) {
            if (typeof processor._attach !== "function") {
                console.error(`Processor ${processor.constructor.refName} not support attach`)

                continue
            }

            instance = await processor._attach(instance, index)
        }

        const lastProcessor = instance.attachedProcessors[instance.attachedProcessors.length - 1].processor

        console.log("Attached processors", instance.attachedProcessors)

        // now attach to destination
        lastProcessor.connect(this.audioContext.destination)

        return instance
    }

    //
    // Playback methods
    //

    async play(instance, params = {}) {
        this.state.startingNew = true

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

        // check if already exists a current instance
        // if exists, destroy it
        // but before, try to detach the last procesor attched to destination
        if (this.currentAudioInstance) {
            this.currentAudioInstance = this.currentAudioInstance.attachedProcessors[this.currentAudioInstance.attachedProcessors.length - 1]._destroy(this.currentAudioInstance)

            this.destroyCurrentInstance()
        }

        // attach processors
        instance = await this.attachProcessorsToInstance(instance)

        // now set the current instance
        this.currentAudioInstance = instance

        this.state.currentAudioManifest = instance.manifest

        this.state.liked = instance.manifest.liked

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

        // reconstruct audio src if is not set
        if (instance.audioElement.src !== instance.manifest.source) {
            instance.audioElement.src = instance.manifest.source
        }

        instance.audioElement.load()

        instance.audioElement.play()

        // set navigator metadata
        this.native_controls.update(instance.manifest)

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

    async startPlaylist(playlist, startIndex = 0, { sync = false } = {}) {
        if (this.state.syncModeLocked && !sync) {
            console.warn("Sync mode is locked, cannot do this action")
            return false
        }

        // playlist is an array of audio manifests
        if (!playlist || !Array.isArray(playlist)) {
            throw new Error("Playlist is required")
        }

        console.log("Starting playlist", playlist)

        // check if the array has strings, if so its means that is the track id, then fetch the track
        if (playlist.some(item => typeof item === "string")) {
            playlist = await this.getTracksByIds(playlist)
        }

        // !IMPORTANT: abort preloads before destroying current instance 
        await this.abortPreloads()

        await this.destroyCurrentInstance()

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

    async start(manifest, { sync = false, time } = {}) {
        if (this.state.syncModeLocked && !sync) {
            console.warn("Sync mode is locked, cannot do this action")
            return false
        }

        this.state.startingNew = true

        // !IMPORTANT: abort preloads before destroying current instance 
        await this.abortPreloads()

        await this.destroyCurrentInstance({
            sync
        })

        const instance = await this.createInstance(manifest)

        this.audioQueue = [instance]

        this.audioQueueHistory = []

        this.state.loading = true

        this.play(this.audioQueue[0], {
            time: time ?? 0
        })
    }

    next({ sync = false } = {}) {
        if (this.state.syncModeLocked && !sync) {
            console.warn("Sync mode is locked, cannot do this action")
            return false
        }

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

        let nextIndex = 0

        // if is in shuffle mode, play a random audio
        if (this.state.playbackMode === "shuffle") {
            nextIndex = Math.floor(Math.random() * this.audioQueue.length)
        }

        // play next audio
        this.play(this.audioQueue[nextIndex])
    }

    previous({ sync = false } = {}) {
        if (this.state.syncModeLocked && !sync) {
            console.warn("Sync mode is locked, cannot do this action")
            return false
        }

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

    async pausePlayback() {
        return await new Promise((resolve, reject) => {
            if (!this.currentAudioInstance) {
                console.error("No audio instance")
                return null
            }

            // set gain exponentially
            this.currentAudioInstance.gainNode.gain.linearRampToValueAtTime(
                0.0001,
                this.audioContext.currentTime + (gradualFadeMs / 1000)
            )

            setTimeout(() => {
                this.currentAudioInstance.audioElement.pause()
                resolve()
            }, gradualFadeMs)

            this.native_controls.updateIsPlaying(false)
        })
    }

    async resumePlayback() {
        return await new Promise((resolve, reject) => {
            if (!this.currentAudioInstance) {
                console.error("No audio instance")
                return null
            }

            // ensure audio elemeto starts from 0 volume
            this.currentAudioInstance.gainNode.gain.value = 0.0001

            this.currentAudioInstance.audioElement.play().then(() => {
                resolve()
            })

            // set gain exponentially
            this.currentAudioInstance.gainNode.gain.linearRampToValueAtTime(
                this.state.audioVolume,
                this.audioContext.currentTime + (gradualFadeMs / 1000)
            )

            this.native_controls.updateIsPlaying(true)
        })
    }

    stop() {
        this.destroyCurrentInstance()

        this.abortPreloads()

        this.state.playbackStatus = "stopped"
        this.state.currentAudioManifest = null

        this.state.livestream = false

        this.audioQueue = []

        this.native_controls.destroy()
    }

    close() {
        this.stop()
        this.detachPlayerComponent()
    }

    toggleMute(to) {
        if (app.isMobile) {
            console.warn("Cannot mute on mobile")
            return false
        }

        this.state.audioMuted = to ?? !this.state.audioMuted

        if (this.currentAudioInstance) {
            this.currentAudioInstance.audioElement.muted = this.state.audioMuted
        }

        return this.state.audioMuted
    }

    toggleMinimize(to) {
        this.state.minimized = to ?? !this.state.minimized

        return this.state.minimized
    }

    volume(volume) {
        if (typeof volume !== "number") {
            return this.state.audioVolume
        }

        if (app.isMobile) {
            console.warn("Cannot change volume on mobile")
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

        this.state.audioVolume = volume

        if (this.currentAudioInstance) {
            if (this.currentAudioInstance.gainNode) {
                this.currentAudioInstance.gainNode.gain.value = this.state.audioVolume
            }
        }

        return this.state.audioVolume
    }

    seek(time, { sync = false } = {}) {
        if (!this.currentAudioInstance) {
            return false
        }

        // if time not provided, return current time
        if (typeof time === "undefined") {
            return this.currentAudioInstance.audioElement.currentTime
        }

        if (this.state.syncModeLocked && !sync) {
            console.warn("Sync mode is locked, cannot do this action")
            return false
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
        if (this.state.syncModeLocked) {
            console.warn("Sync mode is locked, cannot do this action")
            return false
        }

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

    toggleSyncMode(to, lock) {
        if (typeof to !== "boolean") {
            console.warn("Sync mode must be a boolean")
            return false
        }

        this.state.syncMode = to ?? !this.state.syncMode

        this.state.syncModeLocked = lock ?? false

        console.log(`Sync mode is now ${this.state.syncMode ? "enabled" : "disabled"} | Locked: ${this.state.syncModeLocked ? "yes" : "no"}`)

        return this.state.syncMode
    }

    currentState() {
        return {
            playbackStatus: this.state.playbackStatus,
            colorAnalysis: this.state?.coverColorAnalysis ?? null,
            manifest: this.currentAudioInstance?.manifest ?? null,
            loading: this.state.loading,
            time: this.seek(),
            duration: this.currentAudioInstance?.audioElement?.duration ?? null,
            audioMuted: this.state.audioMuted,
            audioVolume: this.state.audioVolume,
        }
    }

    async getTracksByIds(list) {
        if (!Array.isArray(list)) {
            console.warn("List must be an array")
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

        const fetchedTracks = await PlaylistModel.getTracks(ids).catch((err) => {
            console.error(err)
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
            console.error("Sample rate must be a number")
            return this.audioContext.sampleRate
        }

        // must be a integer
        if (!Number.isInteger(to)) {
            console.error("Sample rate must be a integer")
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