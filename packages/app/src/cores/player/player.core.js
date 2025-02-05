import { Core } from "@ragestudio/vessel"

import RemoteEvent from "@classes/RemoteEvent"
import QueueManager from "@classes/QueueManager"
import TrackInstance from "./classes/TrackInstance"
import MediaSession from "./classes/MediaSession"
import ServiceProviders from "./classes/Services"
import PlayerState from "./classes/PlayerState"
import PlayerUI from "./classes/PlayerUI"
import PlayerProcessors from "./classes/PlayerProcessors"

import setSampleRate from "./helpers/setSampleRate"

import AudioPlayerStorage from "./player.storage"

export default class Player extends Core {
	// core config
	static dependencies = ["api", "settings"]
	static namespace = "player"
	static bgColor = "aquamarine"
	static textColor = "black"

	// player config
	static defaultSampleRate = 48000
	static gradualFadeMs = 150
	static maxManifestPrecompute = 3

	state = new PlayerState(this)
	ui = new PlayerUI(this)
	serviceProviders = new ServiceProviders()
	nativeControls = new MediaSession()
	audioContext = new AudioContext({
		sampleRate:
			AudioPlayerStorage.get("sample_rate") ?? Player.defaultSampleRate,
		latencyHint: "playback",
	})

	audioProcessors = new PlayerProcessors(this)

	queue = new QueueManager({
		loadFunction: this.createInstance,
	})

	currentTrackInstance = null

	public = {
		start: this.start,
		close: this.close,
		queue: this.bindableReadOnlyProxy({
			items: () => {
				return this.queue.nextItems
			},
			add: this.addToQueue,
		}),
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
			return this.queue.currentItem
		},
		eventBus: () => {
			return this.eventBus
		},
		state: this.state,
		ui: this.ui.public,
		audioContext: this.audioContext,
		gradualFadeMs: Player.gradualFadeMs,
	}

	async afterInitialize() {
		if (app.isMobile) {
			this.state.volume = 1
		}

		await this.nativeControls.initialize()
		await this.audioProcessors.initialize()
	}

	//
	//  Instance managing methods
	//
	async abortPreloads() {
		for await (const instance of this.queue.nextItems) {
			if (instance.abortController?.abort) {
				instance.abortController.abort()
			}
		}
	}

	async createInstance(manifest) {
		return new TrackInstance(this, manifest)
	}

	//
	// Playback methods
	//
	async play(instance, params = {}) {
		if (!instance) {
			throw new Error("Audio instance is required")
		}

		this.console.log("Initializing instance", instance)

		// resume audio context if needed
		if (this.audioContext.state === "suspended") {
			this.audioContext.resume()
		}

		// initialize instance if is not
		if (this.queue.currentItem._initialized === false) {
			this.queue.currentItem = await instance.initialize()
		}

		this.console.log("Instance", this.queue.currentItem)

		// update manifest
		this.state.track_manifest = this.queue.currentItem.manifest

		// attach processors
		this.queue.currentItem =
			await this.audioProcessors.attachProcessorsToInstance(
				this.queue.currentItem,
			)

		// set audio properties
		this.queue.currentItem.audio.currentTime = params.time ?? 0
		this.queue.currentItem.audio.muted = this.state.muted
		this.queue.currentItem.audio.loop =
			this.state.playback_mode === "repeat"
		this.queue.currentItem.gainNode.gain.value = this.state.volume

		// play
		await this.queue.currentItem.audio.play()

		this.console.log(`Playing track >`, this.queue.currentItem)

		// update native controls
		this.nativeControls.update(this.queue.currentItem.manifest)

		return this.queue.currentItem
	}

	async start(manifest, { time, startIndex = 0 } = {}) {
		this.ui.attachPlayerComponent()

		if (this.queue.currentItem) {
			await this.queue.currentItem.stop()
		}

		await this.abortPreloads()
		await this.queue.flush()

		this.state.loading = true

		let playlist = Array.isArray(manifest) ? manifest : [manifest]

		if (playlist.length === 0) {
			this.console.warn(`Playlist is empty, aborting...`)
			return false
		}

		if (playlist.some((item) => typeof item === "string")) {
			playlist = await this.serviceProviders.resolveMany(playlist)
		}

		for await (const [index, _manifest] of playlist.entries()) {
			let instance = await this.createInstance(_manifest)

			this.queue.add(instance)
		}

		const item = this.queue.set(startIndex)

		this.play(item, {
			time: time ?? 0,
		})

		// send the event to the server
		if (item.manifest._id && item.manifest.service === "default") {
			new RemoteEvent("player.play", {
				identifier: "unique", // this must be unique to prevent duplicate events and ensure only have unique track events
				track_id: item.manifest._id,
				service: item.manifest.service,
			})
		}

		return manifest
	}

	// similar to player.start, but add to the queue
	// if next is true, it will add to the queue to the top of the queue
	async addToQueue(manifest, { next = false }) {
		if (typeof manifest === "string") {
			manifest = await this.serviceProviders.resolve(manifest)
		}

		let instance = await this.createInstance(manifest)

		this.queue.add(instance, next === true ? "start" : "end")

		console.log("Added to queue", {
			manifest,
			queue: this.queue,
		})
	}

	next() {
		if (this.queue.currentItem) {
			this.queue.currentItem.stop()
		}

		//const isRandom = this.state.playback_mode === "shuffle"
		const item = this.queue.next()

		if (!item) {
			return this.stopPlayback()
		}

		return this.play(item)
	}

	previous() {
		if (this.queue.currentItem) {
			this.queue.currentItem.stop()
		}

		const item = this.queue.previous()

		return this.play(item)
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
			if (!this.queue.currentItem) {
				this.console.error("No audio instance")
				return null
			}

			// set gain exponentially
			this.queue.currentItem.gainNode.gain.linearRampToValueAtTime(
				0.0001,
				this.audioContext.currentTime + Player.gradualFadeMs / 1000,
			)

			setTimeout(() => {
				this.queue.currentItem.audio.pause()
				resolve()
			}, Player.gradualFadeMs)

			this.nativeControls.updateIsPlaying(false)
		})
	}

	async resumePlayback() {
		if (!this.state.playback_status === "playing") {
			return true
		}

		return await new Promise((resolve, reject) => {
			if (!this.queue.currentItem) {
				this.console.error("No audio instance")
				return null
			}

			// ensure audio elemeto starts from 0 volume
			this.queue.currentItem.gainNode.gain.value = 0.0001

			this.queue.currentItem.audio.play().then(() => {
				resolve()
			})

			// set gain exponentially
			this.queue.currentItem.gainNode.gain.linearRampToValueAtTime(
				this.state.volume,
				this.audioContext.currentTime + Player.gradualFadeMs / 1000,
			)

			this.nativeControls.updateIsPlaying(true)
		})
	}

	playbackMode(mode) {
		if (typeof mode !== "string") {
			return this.state.playback_mode
		}

		this.state.playback_mode = mode

		if (this.queue.currentItem) {
			this.queue.currentItem.audio.loop =
				this.state.playback_mode === "repeat"
		}

		AudioPlayerStorage.set("mode", mode)

		return mode
	}

	stopPlayback() {
		if (this.queue.currentItem) {
			this.queue.currentItem.stop()
		}

		this.queue.flush()

		this.abortPreloads()

		this.state.playback_status = "stopped"
		this.state.track_manifest = null

		this.queue.currentItem = null
		this.track_next_instances = []
		this.track_prev_instances = []

		this.nativeControls.destroy()
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
			this.queue.currentItem.audio.muted = to
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

		if (this.queue.currentItem) {
			if (this.queue.currentItem.gainNode) {
				this.queue.currentItem.gainNode.gain.value = this.state.volume
			}
		}

		return this.state.volume
	}

	seek(time) {
		if (!this.queue.currentItem || !this.queue.currentItem.audio) {
			return false
		}

		// if time not provided, return current time
		if (typeof time === "undefined") {
			return this.queue.currentItem.audio.currentTime
		}

		// if time is provided, seek to that time
		if (typeof time === "number") {
			this.console.log(
				`Seeking to ${time} | Duration: ${this.queue.currentItem.audio.duration}`,
			)

			this.queue.currentItem.audio.currentTime = time

			return time
		}
	}

	duration() {
		if (!this.queue.currentItem || !this.queue.currentItem.audio) {
			return false
		}

		return this.queue.currentItem.audio.duration
	}

	loop(to) {
		if (typeof to !== "boolean") {
			this.console.warn("Loop must be a boolean")
			return false
		}

		this.state.loop = to ?? !this.state.loop

		if (this.queue.currentItem.audio) {
			this.queue.currentItem.audio.loop = this.state.loop
		}

		return this.state.loop
	}

	close() {
		this.stopPlayback()
		this.ui.detachPlayerComponent()
	}

	registerService(serviceInteface) {
		this.serviceProviders.register(serviceInteface)
	}
}
