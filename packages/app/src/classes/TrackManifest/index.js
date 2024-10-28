import jsmediatags from "jsmediatags/dist/jsmediatags.min.js"
import { FastAverageColor } from "fast-average-color"

import MusicService from "@models/music"

export default class TrackManifest {
    constructor(params) {
        this.params = params

        this.uid = params.uid ?? params._id
        this._id = params._id

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

        if (typeof params.artists !== "undefined" || Array.isArray(params.artists)) {
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

    cover = "https://storage.ragestudio.net/comty-static-assets/default_song.png"
    title = "Untitled"
    album = "Unknown"
    artist = "Unknown"
    source = null
    metadata = null

    // Extended from db
    lyrics_enabled = false

    liked = null

    async initialize() {
        if (this.params.file) {
            this.metadata = await this.analyzeMetadata(this.params.file.originFileObj)

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
                    this.cover = app.cores.remoteStorage.binaryArrayToFile(this.metadata.tags.picture, this.title)

                    const coverUpload = await app.cores.remoteStorage.uploadFile(this.cover)

                    this.cover = coverUpload.url
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
                }
            })
        })
    }

    analyzeCoverColor = async () => {
        const fac = new FastAverageColor()

        this.cover_analysis = await fac.getColorAsync(this.cover)

        return this
    }

    fetchLikeStatus = async () => {
        if (!this._id) {
            return null
        }

        return await MusicService.isItemFavourited("track", this._id)
    }
}