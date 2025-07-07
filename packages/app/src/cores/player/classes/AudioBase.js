import * as dashjs from "dashjs"

import MPDParser from "../mpd_parser"

import PlayerProcessors from "./PlayerProcessors"
import AudioPlayerStorage from "../player.storage"
import TrackManifest from "../classes/TrackManifest"

import parseSourceFormatMetadata from "../helpers/parseSourceFormatMetadata"

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

		// setup dash.js player for mpd
		this.createDemuxer()

		// create element source with low latency buffer
		this.elementSource = this.context.createMediaElementSource(this.audio)

		await this.processorsManager.initialize()
		await this.processorsManager.attachAllNodes()
	}

	itemInit = async (manifest) => {
		if (!manifest) {
			return null
		}

		if (manifest._initialized) {
			return manifest
		}

		this.console.time("itemInit()")

		if (
			typeof manifest === "string" ||
			(!manifest.source && !manifest.dash_manifest)
		) {
			this.console.time("resolve manifest")
			manifest = await this.player.serviceProviders.resolve(manifest)
			this.console.timeEnd("resolve manifest")
		}

		if (!(manifest instanceof TrackManifest)) {
			this.console.time("instanciate class")
			manifest = new TrackManifest(manifest, this.player)
			this.console.timeEnd("instanciate class")
		}

		if (manifest.mpd_mode === true && !manifest.dash_manifest && this.demuxer) {
			this.console.time("fetch")
			const manifestString = await fetch(manifest.source).then((res) =>
				res.text(),
			)
			this.console.timeEnd("fetch")

			this.console.time("parse mpd")
			manifest.dash_manifest = await MPDParser(manifestString, manifest.source)
			this.console.timeEnd("parse mpd")
		}

		manifest._initialized = true
		this.console.timeEnd("itemInit()")

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

		if (manifest.mpd_mode && this.demuxer) {
			this.console.time("play")
			await this.demuxer.play()
			this.console.timeEnd("play")
		}

		if (!manifest.mpd_mode && this.audio.paused) {
			this.console.time("play")
			await this.audio.play()
			this.console.timeEnd("play")
		}

		let initChunk = manifest.source

		if (this.demuxer && manifest.dash_manifest) {
			let initializationTemplate =
				manifest.dash_manifest["Period"][0]["AdaptationSet"][0][
					"Representation"
				][0]["SegmentTemplate"]["initialization"]

			initializationTemplate = initializationTemplate.replace(
				"$RepresentationID$",
				"0",
			)

			initChunk = new URL(initializationTemplate, manifest.source)
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
				await this.createDemuxer()
			}

			await this.demuxer.attachSource(manifest.dash_manifest, 0)

			return manifest.source
		}

		// if not using demuxer, destroy previous instance
		if (this.demuxer) {
			try {
				this.demuxer.reset()
				this.demuxer.destroy()
			} catch (error) {
				this.console.warn("Error destroying demuxer:", error)
			}

			this.demuxer = null
		}

		// load source
		this.audio.src = manifest.source
		this.audio.load()

		return manifest.source
	}

	async createDemuxer() {
		// Destroy previous instance if exists
		if (this.demuxer) {
			try {
				this.demuxer.reset()
				this.demuxer.destroy()
			} catch (error) {
				this.console.warn("Error destroying previous demuxer:", error)
			}
		}

		this.demuxer = dashjs.MediaPlayer().create()

		try {
			this.demuxer.initialize(this.audio)
		} catch (error) {
			this.console.error("Error initializing DASH.js player:", error)
			throw error
		}

		this.demuxer.updateSettings({
			streaming: {
				//cacheInitSegments: true,
				buffer: {
					bufferTimeAtTopQuality: 30,
					bufferTimeAtTopQualityLongForm: 60,
					bufferTimeDefault: 20,
					initialBufferLevel: 5,
					bufferToKeep: 10,
					longFormContentDurationThreshold: 300,
					stallThreshold: 0.5,
					bufferPruningInterval: 30,
				},
				abr: {
					initialBitrate: {
						audio: 128,
					},
					rules: {
						insufficientBufferRule: {
							active: true,
							parameters: {
								bufferLevel: 0.3,
							},
						},
						switchHistoryRule: {
							active: true,
							parameters: {
								sampleSize: 8,
							},
						},
					},
					throughput: {
						averageCalculationMode: "slidingWindow",
						slidingWindowSize: 20,
						ewmaHalfLife: 4,
					},
				},
				retrySettings: {
					maxRetries: 5,
					retryDelayMs: 1000,
					retryBackoffFactor: 2,
				},
				requests: {
					requestTimeout: 30000,
					xhrWithCredentials: false,
				},
			},
		})

		// Event listeners
		this.demuxer.on(dashjs.MediaPlayer.events.ERROR, (event) => {
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
			if (
				this.player.queue.nextItems[0] &&
				!this.player.queue.nextItems[0]._initialized
			) {
				this.player.queue.nextItems[0] = await this.itemInit(
					this.player.queue.nextItems[0],
				)
			}
		}
	}

	async flush() {
		this.audio.pause()
		this.audio.currentTime = 0
		await this.createDemuxer()
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
