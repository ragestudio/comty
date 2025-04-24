import { MediaPlayer } from "dashjs"
import PlayerProcessors from "./PlayerProcessors"
import AudioPlayerStorage from "../player.storage"

export default class AudioBase {
	constructor(player) {
		this.player = player
	}

	audio = new Audio()
	context = null
	demuxer = null
	elementSource = null

	processorsManager = new PlayerProcessors(this)
	processors = {}

	waitUpdateTimeout = null

	initialize = async () => {
		// create a audio context
		this.context = new AudioContext({
			sampleRate:
				AudioPlayerStorage.get("sample_rate") ??
				this.player.constructor.defaultSampleRate,
			latencyHint: "playback",
		})

		// configure some settings for audio
		this.audio.crossOrigin = "anonymous"
		this.audio.preload = "metadata"

		// listen all events
		for (const [key, value] of Object.entries(this.audioEvents)) {
			this.audio.addEventListener(key, value)
		}

		// setup demuxer for mpd
		this.createDemuxer()

		// create element source
		this.elementSource = this.context.createMediaElementSource(this.audio)

		// initialize audio processors
		await this.processorsManager.initialize()
		await this.processorsManager.attachAllNodes()
	}

	createDemuxer() {
		this.demuxer = MediaPlayer().create()

		this.demuxer.updateSettings({
			streaming: {
				buffer: {
					resetSourceBuffersForTrackSwitch: true,
				},
			},
		})

		this.demuxer.initialize(this.audio, null, false)
	}

	flush() {
		this.audio.pause()
		this.audio.src = null
		this.audio.currentTime = 0

		this.demuxer.destroy()
		this.createDemuxer()
	}

	audioEvents = {
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
}
