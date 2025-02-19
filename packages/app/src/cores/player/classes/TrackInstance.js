import TrackManifest from "./TrackManifest"
import { MediaPlayer } from "dashjs"

export default class TrackInstance {
	constructor(player, manifest) {
		if (!player) {
			throw new Error("Player core is required")
		}

		if (typeof manifest === "undefined") {
			throw new Error("Manifest is required")
		}

		this.player = player
		this.manifest = manifest

		this.id = this.manifest.id ?? this.manifest._id

		return this
	}

	_initialized = false

	audio = null

	contextElement = null

	abortController = new AbortController()

	attachedProcessors = []

	waitUpdateTimeout = null

	mediaEvents = {
		ended: () => {
			this.player.next()
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
		play: () => {
			this.player.state.playback_status = "playing"
		},
		playing: () => {
			this.player.state.loading = false

			this.player.state.playback_status = "playing"

			if (typeof this.waitUpdateTimeout !== "undefined") {
				clearTimeout(this.waitUpdateTimeout)
				this.waitUpdateTimeout = null
			}
		},
		pause: () => {
			this.player.state.playback_status = "paused"
		},
		durationchange: () => {
			this.player.eventBus.emit(
				`player.durationchange`,
				this.audio.duration,
			)
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

	initialize = async () => {
		this.manifest = await this.resolveManifest()

		this.audio = new Audio()

		this.audio.signal = this.abortController.signal
		this.audio.crossOrigin = "anonymous"
		this.audio.preload = "metadata"

		// support for dash audio streaming
		if (this.manifest.source.endsWith(".mpd")) {
			this.muxerPlayer = MediaPlayer().create()
			this.muxerPlayer.updateSettings({
				streaming: {
					buffer: {
						resetSourceBuffersForTrackSwitch: true,
						useChangeTypeForTrackSwitch: false,
					},
				},
			})
			this.muxerPlayer.initialize(this.audio, null, false)

			this.muxerPlayer.attachSource(this.manifest.source)
		} else {
			this.audio.src = this.manifest.source
		}

		for (const [key, value] of Object.entries(this.mediaEvents)) {
			this.audio.addEventListener(key, value)
		}

		this.contextElement = this.player.audioContext.createMediaElementSource(
			this.audio,
		)

		this._initialized = true

		return this
	}

	stop = () => {
		if (this.audio) {
			this.audio.pause()
		}

		if (this.muxerPlayer) {
			this.muxerPlayer.destroy()
		}

		const lastProcessor =
			this.attachedProcessors[this.attachedProcessors.length - 1]

		if (lastProcessor) {
			this.attachedProcessors[
				this.attachedProcessors.length - 1
			]._destroy(this)
		}

		this.attachedProcessors = []
	}

	resolveManifest = async () => {
		if (typeof this.manifest === "string") {
			this.manifest = {
				src: this.manifest,
			}
		}

		this.manifest = new TrackManifest(this.manifest, {
			serviceProviders: this.player.serviceProviders,
		})

		if (this.manifest.service) {
			if (!this.player.serviceProviders.has(this.manifest.service)) {
				throw new Error(
					`Service ${this.manifest.service} is not supported`,
				)
			}

			// try to resolve source file
			if (!this.manifest.source) {
				console.log("Resolving manifest cause no source defined")

				this.manifest = await this.player.serviceProviders.resolve(
					this.manifest.service,
					this.manifest,
				)

				console.log("Manifest resolved", this.manifest)
			}
		}

		if (!this.manifest.source) {
			throw new Error("Manifest `source` is required")
		}

		// set empty metadata if not provided
		if (!this.manifest.metadata) {
			this.manifest.metadata = {}
		}

		// auto name if a title is not provided
		if (!this.manifest.metadata.title) {
			this.manifest.metadata.title = this.manifest.source.split("/").pop()
		}

		// process overrides
		const override = await this.manifest.serviceOperations.fetchOverride()

		if (override) {
			console.log(
				`Override found for track ${this.manifest._id}`,
				override,
			)

			this.manifest.overrides = override
		}

		return this.manifest
	}
}
