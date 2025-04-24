import { Core } from "@ragestudio/vessel"

import ActivityEvent from "@classes/ActivityEvent"
import QueueManager from "@classes/QueueManager"
import TrackInstance from "./classes/TrackInstance"
import MediaSession from "./classes/MediaSession"
import ServiceProviders from "./classes/Services"
import PlayerState from "./classes/PlayerState"
import PlayerUI from "./classes/PlayerUI"
import AudioBase from "./classes/AudioBase"

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

	state = new PlayerState(this)
	ui = new PlayerUI(this)
	serviceProviders = new ServiceProviders()
	nativeControls = new MediaSession(this)

	base = new AudioBase(this)

	queue = new QueueManager({
		loadFunction: this.createInstance,
	})

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
		base: () => {
			return this.base
		},
		state: this.state,
		ui: this.ui.public,
	}

	async afterInitialize() {
		if (app.isMobile) {
			this.state.volume = 1
		}

		await this.nativeControls.initialize()
		await this.base.initialize()
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

	//
	// Playback methods
	//
	async play(instance, params = {}) {
		if (!instance) {
			throw new Error("Audio instance is required")
		}

		// resume audio context if needed
		if (this.base.context.state === "suspended") {
			this.base.context.resume()
		}

		// update manifest
		this.state.track_manifest =
			this.queue.currentItem.manifest.toSeriableObject()

		// play
		//await this.queue.currentItem.audio.play()
		await this.queue.currentItem.play(params)

		// update native controls
		this.nativeControls.update(this.queue.currentItem.manifest)

		return this.queue.currentItem
	}

	async start(manifest, { time, startIndex = 0, radioId } = {}) {
		this.ui.attachPlayerComponent()

		if (this.queue.currentItem) {
			await this.queue.currentItem.pause()
		}

		//await this.abortPreloads()
		await this.queue.flush()

		this.state.loading = true

		if (typeof radioId === "string") {
			this.state.radioId = radioId
			this.state.live = true
		} else {
			this.state.radioId = null
			this.state.live = false
		}

		let playlist = Array.isArray(manifest) ? manifest : [manifest]

		if (playlist.length === 0) {
			this.console.warn(`Playlist is empty, aborting...`)
			return false
		}

		if (playlist.some((item) => typeof item === "string")) {
			playlist = await this.serviceProviders.resolveMany(playlist)
		}

		for await (let [index, _manifest] of playlist.entries()) {
			let instance = new TrackInstance(_manifest, this)

			this.queue.add(instance)
		}

		const item = this.queue.set(startIndex)

		this.play(item, {
			time: time ?? 0,
		})

		// send the event to the server
		if (item.manifest._id && item.manifest.service === "default") {
			new ActivityEvent("player.play", {
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
		//const isRandom = this.state.playback_mode === "shuffle"
		const item = this.queue.next()

		if (!item) {
			return this.stopPlayback()
		}

		return this.play(item)
	}

	previous() {
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

			this.base.processors.gain.fade(0)

			setTimeout(() => {
				this.queue.currentItem.pause()
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
			this.queue.currentItem.resume().then(() => {
				resolve()
			})
			this.base.processors.gain.fade(this.state.volume)

			this.nativeControls.updateIsPlaying(true)
		})
	}

	playbackMode(mode) {
		if (typeof mode !== "string") {
			return this.state.playback_mode
		}

		this.state.playback_mode = mode

		this.base.audio.loop = this.state.playback_mode === "repeat"

		AudioPlayerStorage.set("mode", mode)

		return mode
	}

	stopPlayback() {
		this.base.flush()
		this.queue.flush()

		this.state.playback_status = "stopped"
		this.state.track_manifest = null
		this.queue.currentItem = null

		//this.abortPreloads()
		this.nativeControls.flush()
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
			this.base.audio.muted = to
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

		AudioPlayerStorage.set("volume", volume)

		this.state.volume = volume
		this.base.processors.gain.set(volume)

		return this.state.volume
	}

	seek(time) {
		if (!this.base.audio) {
			return false
		}

		// if time not provided, return current time
		if (typeof time === "undefined") {
			return this.base.audio.currentTime
		}

		// if time is provided, seek to that time
		if (typeof time === "number") {
			this.console.log(
				`Seeking to ${time} | Duration: ${this.base.audio.duration}`,
			)

			this.base.audio.currentTime = time

			return time
		}
	}

	duration() {
		if (!this.base.audio) {
			return false
		}

		return this.base.audio.duration
	}

	close() {
		this.stopPlayback()
		this.ui.detachPlayerComponent()
	}

	registerService(serviceInteface) {
		this.serviceProviders.register(serviceInteface)
	}
}
