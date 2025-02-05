import jsmediatags from "jsmediatags/dist/jsmediatags.min.js"
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

		if (
			typeof params.artists !== "undefined" ||
			Array.isArray(params.artists)
		) {
			this.artistStr = params.artists.join(", ")
		}

		if (typeof params.source !== "undefined") {
			this.source = params.source
		}

		if (typeof params.metadata !== "undefined") {
			this.metadata = params.metadata
		}

		if (typeof params.lyrics_enabled !== "undefined") {
			this.lyrics_enabled = params.lyrics_enabled
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
	metadata = null

	// set default service to default
	service = "default"

	// Extended from db
	lyrics_enabled = false
	liked = null

	async initialize() {
		if (this.params.file) {
			this.metadata = await this.analyzeMetadata(
				this.params.file.originFileObj,
			)

			this.metadata.format = this.metadata.type.toUpperCase()

			if (this.metadata.tags) {
				if (this.metadata.tags.title) {
					this.title = this.metadata.tags.title
				}

				if (this.metadata.tags.artist) {
					this.artist = this.metadata.tags.artist
				}

				if (this.metadata.tags.album) {
					this.album = this.metadata.tags.album
				}

				if (this.metadata.tags.picture) {
					this.cover = app.cores.remoteStorage.binaryArrayToFile(
						this.metadata.tags.picture,
						"cover",
					)

					const coverUpload =
						await app.cores.remoteStorage.uploadFile(this.cover)

					this.cover = coverUpload.url

					delete this.metadata.tags.picture
				}

				this.handleChanges({
					cover: this.cover,
					title: this.title,
					artist: this.artist,
					album: this.album,
				})
			}
		}

		return this
	}

	handleChanges = (changes) => {
		if (typeof this.params.onChange === "function") {
			this.params.onChange(this.uid, changes)
		}
	}

	analyzeMetadata = async (file) => {
		return new Promise((resolve, reject) => {
			jsmediatags.read(file, {
				onSuccess: (data) => {
					return resolve(data)
				},
				onError: (error) => {
					return reject(error)
				},
			})
		})
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

			console.log(this.overrides)

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
			title: this.title,
			album: this.album,
			artist: this.artist,
			source: this.source,
			metadata: this.metadata,
			liked: this.liked,
		}
	}
}
