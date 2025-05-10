import TrackManifest from "./TrackManifest"

export default class TrackInstance {
	constructor(manifest, player) {
		if (typeof manifest === "undefined") {
			throw new Error("Manifest is required")
		}

		if (!player) {
			throw new Error("Player core is required")
		}

		if (!(manifest instanceof TrackManifest)) {
			manifest = new TrackManifest(manifest, player)
		}

		if (!manifest.source) {
			throw new Error("Manifest must have a source")
		}

		this.player = player
		this.manifest = manifest

		this.id = this.manifest.id ?? this.manifest._id
	}

	play = async (params = {}) => {
		const startTime = performance.now()

		const isMpd = this.manifest.source.endsWith(".mpd")
		const audioEl = this.player.base.audio

		if (!isMpd) {
			// if a demuxer exists (from a previous MPD track), destroy it
			if (this.player.base.demuxer) {
				this.player.base.demuxer.destroy()
				this.player.base.demuxer = null
			}

			// set the audio source directly
			if (audioEl.src !== this.manifest.source) {
				audioEl.src = this.manifest.source
				audioEl.load() // important to apply the new src and stop previous playback
			}
		} else {
			// ensure the direct 'src' attribute is removed if it was set
			const currentSrc = audioEl.getAttribute("src")

			if (currentSrc && !currentSrc.startsWith("blob:")) {
				// blob: indicates MSE is likely already in use
				audioEl.removeAttribute("src")
				audioEl.load() // tell the element to update its state after src removal
			}

			// ensure a demuxer instance exists
			if (!this.player.base.demuxer) {
				this.player.base.createDemuxer()
			}

			// attach the mpd source to the demuxer
			await this.player.base.demuxer.attachSource(this.manifest.source)
		}

		// reset audio properties
		audioEl.currentTime = params.time ?? 0
		audioEl.volume = 1

		if (this.player.base.processors && this.player.base.processors.gain) {
			this.player.base.processors.gain.set(this.player.state.volume)
		}

		if (audioEl.paused) {
			try {
				await audioEl.play()
			} catch (error) {
				console.error("[INSTANCE] Error during audio.play():", error)
			}
		} else {
			console.log(
				"[INSTANCE] Audio is already playing or will start shortly.",
			)
		}

		this._loadMs = performance.now() - startTime

		console.log(`[INSTANCE] [tooks ${this._loadMs}ms] Playing >`, this)
	}

	pause = async () => {
		console.log("[INSTANCE] Pausing >", this)

		this.player.base.audio.pause()
	}

	resume = async () => {
		console.log("[INSTANCE] Resuming >", this)

		this.player.base.audio.play()
	}
}
