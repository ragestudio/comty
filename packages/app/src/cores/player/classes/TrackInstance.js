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

		if (!this.manifest.source.endsWith(".mpd")) {
			this.player.base.demuxer.destroy()
			this.player.base.audio.src = this.manifest.source
		} else {
			if (!this.player.base.demuxer) {
				this.player.base.createDemuxer()
			}

			await this.player.base.demuxer.attachSource(
				`${this.manifest.source}?t=${Date.now()}`,
			)
		}

		this.player.base.audio.currentTime = params.time ?? 0

		if (this.player.base.audio.paused) {
			await this.player.base.audio.play()
		}

		// reset audio volume and gain
		this.player.base.audio.volume = 1
		this.player.base.processors.gain.set(this.player.state.volume)

		const endTime = performance.now()

		this._loadMs = endTime - startTime

		console.log(`[INSTANCE] Playing >`, this)
	}

	pause = async () => {
		console.log("[INSTANCE] Pausing >", this)

		this.player.base.audio.pause()
	}

	resume = async () => {
		console.log("[INSTANCE] Resuming >", this)

		this.player.base.audio.play()
	}

	// resolveManifest = async () => {
	// 	if (typeof this.manifest === "string") {
	// 		this.manifest = {
	// 			src: this.manifest,
	// 		}
	// 	}

	// 	this.manifest = new TrackManifest(this.manifest, {
	// 		serviceProviders: this.player.serviceProviders,
	// 	})

	// 	if (this.manifest.service) {
	// 		if (!this.player.serviceProviders.has(this.manifest.service)) {
	// 			throw new Error(
	// 				`Service ${this.manifest.service} is not supported`,
	// 			)
	// 		}

	// 		// try to resolve source file
	// 		if (!this.manifest.source) {
	// 			console.log("Resolving manifest cause no source defined")

	// 			this.manifest = await this.player.serviceProviders.resolve(
	// 				this.manifest.service,
	// 				this.manifest,
	// 			)

	// 			console.log("Manifest resolved", this.manifest)
	// 		}
	// 	}

	// 	if (!this.manifest.source) {
	// 		throw new Error("Manifest `source` is required")
	// 	}

	// 	// set empty metadata if not provided
	// 	if (!this.manifest.metadata) {
	// 		this.manifest.metadata = {}
	// 	}

	// 	// auto name if a title is not provided
	// 	if (!this.manifest.metadata.title) {
	// 		this.manifest.metadata.title = this.manifest.source.split("/").pop()
	// 	}

	// 	// process overrides
	// 	const override = await this.manifest.serviceOperations.fetchOverride()

	// 	if (override) {
	// 		console.log(
	// 			`Override found for track ${this.manifest._id}`,
	// 			override,
	// 		)

	// 		this.manifest.overrides = override
	// 	}

	// 	return this.manifest
	// }
}
