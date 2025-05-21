import shaka from "shaka-player/dist/shaka-player.compiled.js"

import PlayerProcessors from "./PlayerProcessors"
import AudioPlayerStorage from "../player.storage"
import TrackManifest from "../classes/TrackManifest"

import findInitializationChunk from "../helpers/findInitializationChunk"
import parseSourceFormatMetadata from "../helpers/parseSourceFormatMetadata"
import handleInlineDashManifest from "../helpers/handleInlineDashManifest"

export default class AudioBase {
	constructor(player) {
		this.player = player
		this.console = player.console
	}

	audio = new Audio()
	context = null
	demuxer = null
	elementSource = null

	processorsManager = new PlayerProcessors(this)
	processors = {}

	waitUpdateTimeout = null
	_firstSegmentReceived = false

	initialize = async () => {
		// create a audio context
		this.context = new AudioContext({
			sampleRate:
				AudioPlayerStorage.get("sample_rate") ??
				this.player.constructor.defaultSampleRate,
			latencyHint: "playback",
		})

		// configure some settings for audio with optimized settings
		this.audio.crossOrigin = "anonymous"
		this.audio.preload = "auto"
		this.audio.loop = this.player.state.playback_mode === "repeat"
		this.audio.volume = 1

		// listen all events
		for (const [key, value] of Object.entries(this.audioEvents)) {
			this.audio.addEventListener(key, value)
		}

		// setup shaka player for mpd
		this.createDemuxer()

		// create element source with low latency buffer
		this.elementSource = this.context.createMediaElementSource(this.audio)

		await this.processorsManager.initialize(),
			await this.processorsManager.attachAllNodes()
	}

	itemInit = async (manifest) => {
		if (!manifest) {
			return null
		}

		if (
			typeof manifest === "string" ||
			(!manifest.source && !manifest.dash_manifest)
		) {
			this.console.time("resolve")
			manifest = await this.player.serviceProviders.resolve(manifest)
			this.console.timeEnd("resolve")
		}

		if (!(manifest instanceof TrackManifest)) {
			this.console.time("init manifest")
			manifest = new TrackManifest(manifest, this.player)
			this.console.timeEnd("init manifest")
		}

		if (manifest.mpd_mode === true && !manifest.dash_manifest) {
			this.console.time("fetch dash manifest")
			manifest.dash_manifest = await fetch(manifest.source).then((r) =>
				r.text(),
			)
			this.console.timeEnd("fetch dash manifest")
		}

		return manifest
	}

	play = async (manifest, params = {}) => {
		// Pre-initialize audio context if needed
		if (this.context.state === "suspended") {
			await this.context.resume()
		}

		manifest = await this.itemInit(manifest)

		this.console.time("load source")
		await this.loadSource(manifest)
		this.console.timeEnd("load source")

		this.player.queue.currentItem = manifest
		this.player.state.track_manifest = manifest.toSeriableObject()
		this.player.nativeControls.update(manifest.toSeriableObject())

		// reset audio properties
		this.audio.currentTime = params.time ?? 0
		this.audio.volume = 1

		if (this.processors && this.processors.gain) {
			this.processors.gain.set(this.player.state.volume)
		}

		if (this.audio.paused) {
			try {
				this.console.time("play")
				await this.audio.play()
				this.console.timeEnd("play")
			} catch (error) {
				this.console.error(
					"Error during audio.play():",
					error,
					"State:",
					this.audio.readyState,
				)
			}
		}

		let initChunk = manifest.source

		if (this.demuxer && manifest.dash_manifest) {
			initChunk = findInitializationChunk(
				manifest.source,
				manifest.dash_manifest,
			)
		}

		try {
			this.player.state.format_metadata =
				await parseSourceFormatMetadata(initChunk)
		} catch (e) {
			this.player.state.format_metadata = null
			console.warn("Could not parse audio metadata from source:", e)
		}
	}

	pause = async () => {
		this.audio.pause()
	}

	resume = async () => {
		this.audio.play()
	}

	async loadSource(manifest) {
		if (!manifest || !(manifest instanceof TrackManifest)) {
			return null
		}

		// reset some state
		this._firstSegmentReceived = false
		this.player.state.format_metadata = null

		const isMpd = manifest.mpd_mode

		if (isMpd) {
			const audioSrcAtt = this.audio.getAttribute("src")

			if (audioSrcAtt && !audioSrcAtt.startsWith("blob:")) {
				this.audio.removeAttribute("src")
				this.audio.load()
			}

			if (!this.demuxer) {
				this.console.log("Creating demuxer cause not initialized")
				this.createDemuxer()
			}

			if (manifest._preloaded) {
				this.console.log(
					`using preloaded source >`,
					manifest._preloaded,
				)

				return await this.demuxer.load(manifest._preloaded)
			}

			const inlineManifest =
				"inline://" + manifest.source + "::" + manifest.dash_manifest

			return await this.demuxer
				.load(inlineManifest, 0, "application/dash+xml")
				.catch((err) => {
					this.console.error("Error loading inline manifest", err)
				})
		}

		// if not using demuxer, destroy previous instance
		if (this.demuxer) {
			await this.demuxer.unload()
			await this.demuxer.destroy()
			this.demuxer = null
		}

		// load source
		this.audio.src = manifest.source
		return this.audio.load()
	}

	async createDemuxer() {
		// Destroy previous instance if exists
		if (this.demuxer) {
			await this.demuxer.unload()
			await this.demuxer.detach()
			await this.demuxer.destroy()
		}

		this.demuxer = new shaka.Player()

		this.demuxer.attach(this.audio)

		this.demuxer.configure({
			manifest: {
				//updatePeriod: 5,
				disableVideo: true,
				disableText: true,
				dash: {
					ignoreMinBufferTime: true,
					ignoreMaxSegmentDuration: true,
					autoCorrectDrift: false,
					enableFastSwitching: true,
					useStreamOnceInPeriodFlattening: false,
				},
			},
			streaming: {
				bufferingGoal: 15,
				rebufferingGoal: 1,
				bufferBehind: 30,
				stallThreshold: 0.5,
			},
		})

		shaka.net.NetworkingEngine.registerScheme(
			"inline",
			handleInlineDashManifest,
		)

		this.demuxer.addEventListener("error", (event) => {
			console.error("Demuxer error", event)
		})
	}

	timeTick = async () => {
		if (
			!this.audio ||
			!this.audio.duration ||
			this.audio.duration === Infinity
		) {
			return false
		}

		const remainingTime = this.audio.duration - this.audio.currentTime

		// if remaining time is less than 3s, try to init next item
		if (parseInt(remainingTime) <= 10) {
			// check if queue has next item
			if (this.player.queue.nextItems[0]) {
				this.player.queue.nextItems[0] = await this.itemInit(
					this.player.queue.nextItems[0],
				)

				if (
					this.demuxer &&
					this.player.queue.nextItems[0].source &&
					this.player.queue.nextItems[0].mpd_mode &&
					!this.player.queue.nextItems[0]._preloaded
				) {
					const manifest = this.player.queue.nextItems[0]

					// preload next item
					this.console.time("preload next item")
					this.player.queue.nextItems[0]._preloaded =
						await this.demuxer.preload(
							"inline://" +
								manifest.source +
								"::" +
								manifest.dash_manifest,
							0,
							"application/dash+xml",
						)
					this.console.timeEnd("preload next item")
				}
			}
		}
	}

	flush() {
		this.audio.pause()
		this.audio.currentTime = 0
		this.createDemuxer()
	}

	audioEvents = {
		ended: () => {
			try {
				this.player.next()
			} catch (e) {
				console.error(e)
			}
		},
		play: () => {
			this.player.state.playback_status = "playing"
		},
		pause: () => {
			this.player.state.playback_status = "paused"

			if (typeof this._timeTickInterval !== "undefined") {
				clearInterval(this._timeTickInterval)
			}
		},
		playing: () => {
			this.player.state.loading = false

			this.player.state.playback_status = "playing"

			if (typeof this.waitUpdateTimeout !== "undefined") {
				clearTimeout(this.waitUpdateTimeout)
				this.waitUpdateTimeout = null
			}

			if (typeof this._timeTickInterval !== "undefined") {
				clearInterval(this._timeTickInterval)
			}

			this.timeTick()

			this._timeTickInterval = setInterval(this.timeTick, 1000)
		},
		loadeddata: () => {
			this.player.state.loading = false
		},
		loadedmetadata: () => {
			if (this.audio.duration === Infinity) {
				this.player.state.live = true
			} else {
				this.player.state.live = false
			}
		},
		waiting: () => {
			if (this.waitUpdateTimeout) {
				clearTimeout(this.waitUpdateTimeout)
				this.waitUpdateTimeout = null
			}

			// if takes more than 150ms to load, update loading state
			this.waitUpdateTimeout = setTimeout(() => {
				this.player.state.loading = true
			}, 150)
		},
		seeked: () => {
			this.player.eventBus.emit(`player.seeked`, this.audio.currentTime)
		},
	}
}
