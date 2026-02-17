import { parseBlob } from "music-metadata"
import { FastAverageColor } from "fast-average-color"

export default class TrackManifest {
	constructor(params, ctx) {
		this.params = params
		this.ctx = ctx

		this.uid = params.uid ?? params._id
		this._id = params._id

		if (typeof params.service !== "undefined") {
			this.service = params.service
		}

		if (typeof params.overrides !== "undefined") {
			this.overrides = params.overrides
		}

		if (typeof params.cover !== "undefined") {
			this.cover = params.cover
		}

		if (typeof params.title !== "undefined") {
			this.title = params.title
		}

		if (typeof params.album !== "undefined") {
			this.album = params.album

			if (typeof this.album === "object") {
				this.album = this.album.title
			}
		}

		if (typeof params.artist !== "undefined") {
			this.artist = params.artist

			if (typeof this.artist === "object") {
				this.artist = this.artist.name
			}
		}

		if (typeof params.source !== "undefined") {
			this.source = params.source
		}

		if (typeof params.mpd_string !== "undefined") {
			this.mpd_string = params.mpd_string
		}

		if (typeof params.metadata !== "undefined") {
			this.metadata = params.metadata
		}

		if (typeof params.liked !== "undefined") {
			this.liked = params.liked
		}

		if (typeof params.public !== "undefined") {
			this.public = params.public
		}

		if (typeof params.timings !== "undefined") {
			this.timings = params.timings
		}

		if (this.source) {
			this.mpd_mode =
				this.source.startsWith("blob:") || this.source.endsWith(".mpd")
		}

		return this
	}

	_id = null // used for api requests
	uid = null // used for internal

	title = "Untitled"
	album = "Unknown"
	artist = "Unknown"
	cover = null // set default cover url
	source = null
	metadata = {}
	timings = null

	// set default service to default
	service = "default"
	mpd_mode = false

	async initialize() {
		if (!this.params.file || !(this.params.file instanceof File)) {
			return this
		}

		const analyzedMetadata = await parseBlob(this.params.file, {
			skipPostHeaders: true,
		}).catch(() => ({}))

		if (analyzedMetadata.format) {
			this.metadata.format = analyzedMetadata.format.codec
		}

		if (analyzedMetadata.common) {
			this.title = analyzedMetadata.common.title ?? this.title
			this.artist = analyzedMetadata.common.artist ?? this.artist
			this.album = analyzedMetadata.common.album ?? this.album
		}

		if (analyzedMetadata.common.picture) {
			const cover = analyzedMetadata.common.picture[0]

			this._coverBlob = new Blob([cover.data], { type: cover.format })
			this.cover = URL.createObjectURL(this._coverBlob)
		}

		return this
	}

	analyzeCoverColor = async () => {
		const fac = new FastAverageColor()

		const img = new Image()

		img.src = this.cover + "?t=a"
		img.crossOrigin = "anonymous"

		return await fac.getColorAsync(img)
	}

	serviceOperations = {
		fetchLyrics: async (options) => {
			if (!this._id) {
				return null
			}

			const result = await this.ctx.serviceProviders.operation(
				"resolveLyrics",
				this.service,
				this,
				options,
			)

			if (this.overrides) {
				return {
					...result,
					...this.overrides,
				}
			}

			return result
		},
		fetchOverride: async () => {
			if (!this._id) {
				return null
			}

			return await this.ctx.serviceProviders.operation(
				"resolveOverride",
				this.service,
				this,
			)
		},
		toggleItemFavorite: async (to) => {
			if (!this._id) {
				return null
			}

			return await this.ctx.serviceProviders.operation(
				"toggleItemFavorite",
				this.service,
				this,
				"tracks",
				to,
			)
		},
		isItemFavorited: async () => {
			if (!this._id) {
				return null
			}

			return await this.ctx.serviceProviders.operation(
				"isItemFavorited",
				this.service,
				this,
				"tracks",
			)
		},
	}

	toSeriableObject = () => {
		return {
			_id: this._id,
			uid: this.uid,
			cover: this.cover,
			title: this.title,
			album: this.album,
			artist: this.artist,
			source: this.source,
			mpd_string: this.mpd_string,
			metadata: this.metadata,
			liked: this.liked,
			service: this.service,
			timings: this.timings,
		}
	}
}
