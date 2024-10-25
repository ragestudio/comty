import { Core } from "vessel"

import TrackInstance from "@classes/TrackInstance"
import MediaSession from "./classes/MediaSession"
import ServiceProviders from "./classes/Services"
import PlayerState from "./classes/PlayerState"
import PlayerUI from "./classes/PlayerUI"
import PlayerProcessors from "./classes/PlayerProcessors"

import setSampleRate from "./helpers/setSampleRate"

import AudioPlayerStorage from "./player.storage"

export default class Player extends Core {
    // core config
    static dependencies = [
        "api",
        "settings"
    ]
    static namespace = "player"
    static bgColor = "aquamarine"
    static textColor = "black"

    // player config
    static defaultSampleRate = 48000
    static gradualFadeMs = 150
    static maxManifestPrecompute = 3

    state = new PlayerState(this)
    ui = new PlayerUI(this)
    service_providers = new ServiceProviders()
    native_controls = new MediaSession()
    audioContext = new AudioContext({
        sampleRate: AudioPlayerStorage.get("sample_rate") ?? Player.defaultSampleRate,
        latencyHint: "playback"
    })

    audioProcessors = new PlayerProcessors(this)

    track_prev_instances = []
    track_instance = null
    track_next_instances = []

    public = {
        start: this.start,
        close: this.close,
        playback: this.bindableReadOnlyProxy({
            toggle: this.togglePlayback,
            play: this.resumePlayback,
            pause: this.pausePlayback,
            stop: this.stopPlayback,
            previous: this.previous,
            next: this.next,
            mode: this.playbackMode,
        }),
        controls: this.bindableReadOnlyProxy({
            duration: this.duration,
            volume: this.volume,
            mute: this.mute,
            seek: this.seek,
            setSampleRate: setSampleRate,
        }),
        track: () => {
            return this.track_instance
        },
        eventBus: () => {
            return this.eventBus
        },
        state: this.state,
        ui: this.ui.public,
        audioContext: this.audioContext,
        gradualFadeMs: Player.gradualFadeMs,
    }

    async initializeAfterCoresInit() {
        if (app.isMobile) {
            this.state.volume = 1
        }

        await this.native_controls.initialize()
        await this.audioProcessors.initialize()
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

        if (isIndex) {
            this.track_next_instances[index] = instance
        }

        return instance
    }

    async destroyCurrentInstance() {
        if (!this.track_instance) {
            return false
        }

        // stop playback
        if (this.track_instance.audio) {
            this.track_instance.audio.pause()
        }

        // reset track_instance
        this.track_instance = null
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

        // chage current track instance with provided
        this.track_instance = instance

        // initialize instance if is not
        if (this.track_instance._initialized === false) {
            this.track_instance = await instance.initialize()
        }

        // update manifest
        this.state.track_manifest = this.track_instance.manifest

        // attach processors
        this.track_instance = await this.audioProcessors.attachProcessorsToInstance(this.track_instance)

        // reconstruct audio src if is not set
        if (this.track_instance.audio.src !== this.track_instance.manifest.source) {
            this.track_instance.audio.src = this.track_instance.manifest.source
        }

        // set time to provided time, if not, set to 0
        this.track_instance.audio.currentTime = params.time ?? 0

        this.track_instance.audio.muted = this.state.muted
        this.track_instance.audio.loop = this.state.playback_mode === "repeat"

        this.track_instance.gainNode.gain.value = this.state.volume

        // play
        await this.track_instance.audio.play()

        this.console.debug(`Playing track >`, this.track_instance)

        // update native controls
        this.native_controls.update(this.track_instance.manifest)

        return this.track_instance
    }

    async start(manifest, { time, startIndex = 0 } = {}) {
        this.ui.attachPlayerComponent()

        // !IMPORTANT: abort preloads before destroying current instance 
        await this.abortPreloads()
        await this.destroyCurrentInstance()

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

        for (const [index, _manifest] of playlist.entries()) {
            let instance = new TrackInstance(this, _manifest)

            this.track_next_instances.push(instance)

            if (index === 0) {
                this.play(this.track_next_instances[0], {
                    time: time ?? 0
                })
            }
        }

        return manifest
    }

    next() {
        if (this.track_next_instances.length > 0) {
            // move current audio instance to history
            this.track_prev_instances.push(this.track_next_instances.shift())
        }

        if (this.track_next_instances.length === 0) {
            this.console.log(`No more tracks to play, stopping...`)

            return this.stopPlayback()
        }

        let nextIndex = 0

        if (this.state.playback_mode === "shuffle") {
            nextIndex = Math.floor(Math.random() * this.track_next_instances.length)
        }

        this.play(this.track_next_instances[nextIndex])
    }

    previous() {
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

    //
    // Playback Control
    //
    async togglePlayback() {
        if (this.state.playback_status === "paused") {
            await this.resumePlayback()
        } else {
            await this.pausePlayback()
        }
    }

    async pausePlayback() {
        if (!this.state.playback_status === "paused") {
            return true
        }

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

    async playbackMode(mode) {
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

    async stopPlayback() {
        this.destroyCurrentInstance()
        this.abortPreloads()

        this.state.playback_status = "stopped"
        this.state.track_manifest = null

        this.track_instance = null
        this.track_next_instances = []
        this.track_prev_instances = []

        this.native_controls.destroy()
    }

    //
    // Audio Control
    //
    mute(to) {
        if (app.isMobile && typeof to !== "boolean") {
            this.console.warn("Cannot mute on mobile")
            return false
        }

        if (to === "toggle") {
            to = !this.state.muted
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

    seek(time) {
        if (!this.track_instance || !this.track_instance.audio) {
            return false
        }

        // if time not provided, return current time
        if (typeof time === "undefined") {
            return this.track_instance.audio.currentTime
        }

        // if time is provided, seek to that time
        if (typeof time === "number") {
            this.console.log(`Seeking to ${time} | Duration: ${this.track_instance.audio.duration}`)

            this.track_instance.audio.currentTime = time

            return time
        }
    }

    duration() {
        if (!this.track_instance || !this.track_instance.audio) {
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
        this.stopPlayback()
        this.ui.detachPlayerComponent()
    }
}