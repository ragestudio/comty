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
		}

		if (typeof params.artist !== "undefined") {
			this.artist = params.artist
		}

		if (typeof params.source !== "undefined") {
			this.source = params.source
		}

		if (typeof params.metadata !== "undefined") {
			this.metadata = params.metadata
		}

		if (typeof params.liked !== "undefined") {
			this.liked = params.liked
		}

		return this
	}

	_id = null // used for api requests
	uid = null // used for internal

	cover =
		"https://storage.ragestudio.net/comty-static-assets/default_song.png"
	title = "Untitled"
	album = "Unknown"
	artist = "Unknown"
	source = null
	metadata = {}

	// set default service to default
	service = "default"

	// Extended from db
	liked = null

	async initialize() {
		if (!this.params.file) {
			return this
		}

		const analyzedMetadata = await parseBlob(
			this.params.file.originFileObj,
			{
				skipPostHeaders: true,
			},
		).catch(() => ({}))

		this.metadata.format = analyzedMetadata.format.codec

		if (analyzedMetadata.common) {
			this.title = analyzedMetadata.common.title ?? this.title
			this.artist = analyzedMetadata.common.artist ?? this.artist
			this.album = analyzedMetadata.common.album ?? this.album
		}

		if (analyzedMetadata.common.picture) {
			const cover = analyzedMetadata.common.picture[0]

			const coverFile = new File([cover.data], "cover", {
				type: cover.format,
			})

			const coverUpload =
				await app.cores.remoteStorage.uploadFile(coverFile)

			this.cover = coverUpload.url
		}

		this.handleChanges({
			cover: this.cover,
			title: this.title,
			artist: this.artist,
			album: this.album,
		})

		return this
	}

	handleChanges = (changes) => {
		if (typeof this.params.onChange === "function") {
			this.params.onChange(this.uid, changes)
		}
	}

	analyzeCoverColor = async () => {
		const fac = new FastAverageColor()

		return await fac.getColorAsync(this.cover)
	}

	serviceOperations = {
		fetchLikeStatus: async () => {
			if (!this._id) {
				return null
			}

			return await this.ctx.serviceProviders.operation(
				"isItemFavourited",
				this.service,
				this,
				"track",
			)
		},
		fetchLyrics: async () => {
			if (!this._id) {
				return null
			}

			const result = await this.ctx.serviceProviders.operation(
				"resolveLyrics",
				this.service,
				this,
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
		toggleItemFavourite: async (to) => {
			if (!this._id) {
				return null
			}

			return await this.ctx.serviceProviders.operation(
				"toggleItemFavourite",
				this.service,
				this,
				"track",
				to,
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
			metadata: this.metadata,
			liked: this.liked,
		}
	}
}
