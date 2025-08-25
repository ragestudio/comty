import Core from "vessel/core"

import ActivityEvent from "@classes/ActivityEvent"
import QueueManager from "@classes/QueueManager"
import TrackManifest from "./classes/TrackManifest"
import MediaSession from "./classes/MediaSession"
import ServiceProviders from "./classes/Services"
import PlayerState from "./classes/PlayerState"
import PlayerUI from "./classes/PlayerUI"
import AudioBase from "./classes/AudioBase"
import SyncRoom from "./classes/SyncRoom"

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

	base = new AudioBase(this)
	state = new PlayerState(this)
	ui = new PlayerUI(this)
	serviceProviders = new ServiceProviders()
	nativeControls = new MediaSession(this)
	syncRoom = new SyncRoom(this)

	queue = new QueueManager()

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
		sync: () => this.syncRoom,
		inOnSyncMode: this.inOnSyncMode,
		state: this.state,
		ui: this.ui.public,
	}

	inOnSyncMode() {
		return !!this.syncRoom.state.joined_room
	}

	async afterInitialize() {
		if (app.isMobile) {
			this.state.volume = 1
		}

		await this.nativeControls.initialize()
		await this.base.initialize()
	}

	async start(manifest, { time, startIndex = 0, radioId } = {}) {
		this.console.debug("start():", {
			manifest: manifest,
			time: time,
			startIndex: startIndex,
			radioId: radioId,
		})

		this.ui.attachPlayerComponent()

		if (this.queue.currentItem) {
			await this.base.pause()
		}

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

		// resolve only the first item if needed
		if (
			typeof playlist[0] === "string" ||
			(!playlist[0].source && !playlist[0].dash_manifest)
		) {
			playlist[0] = await this.serviceProviders.resolve(playlist[0])
		}

		// create instance for the first element
		playlist[0] = new TrackManifest(playlist[0], this)

		this.queue.add(playlist)

		const item = this.queue.setCurrent(startIndex)

		this.base.play(item, {
			time: time ?? 0,
		})

		// send the event to the server
		if (item._id && item.service === "default") {
			new ActivityEvent("player.play", {
				identifier: "unique", // this must be unique to prevent duplicate events and ensure only have unique track events
				track_id: item._id,
				service: item.service,
			})
		}

		return manifest
	}

	// similar to player.start, but add to the queue
	// if next is true, it will add to the queue to the top of the queue
	async addToQueue(manifest, { next = false } = {}) {
		if (this.inOnSyncMode()) {
			return false
		}

		if (this.state.playback_status === "stopped") {
			return this.start(manifest)
		}

		this.queue.add(manifest, next === true ? "start" : "end")

		console.log("Added to queue", {
			manifest,
			queue: this.queue,
		})
	}

	next() {
		if (this.inOnSyncMode()) {
			return false
		}

		//const isRandom = this.state.playback_mode === "shuffle"
		const item = this.queue.next()

		if (!item) {
			return this.stopPlayback()
		}

		return this.base.play(item)
	}

	previous() {
		if (this.inOnSyncMode()) {
			return false
		}

		const item = this.queue.previous()

		return this.base.play(item)
	}

	//
	// Playback Control
	//
	async togglePlayback() {
		if (this.inOnSyncMode()) {
			return false
		}

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
				this.base.pause()
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
			this.base.resume().then(() => {
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
		this.state.playback_status = "stopped"
		this.state.track_manifest = null
		this.queue.currentItem = null

		this.base.flush()
		this.queue.flush()

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
