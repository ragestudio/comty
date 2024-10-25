import jsmediatags from "jsmediatags/dist/jsmediatags.min.js"
import { FastAverageColor } from "fast-average-color"

async function uploadBinaryArrayToStorage(bin, args) {
    const { format, data } = bin

    const filenameExt = format.split("/")[1]
    const filename = `cover.${filenameExt}`

    const byteArray = new Uint8Array(data)
    const blob = new Blob([byteArray], { type: data.type })

    // create a file object
    const file = new File([blob], filename, {
        type: format,
    })

    return await app.cores.remoteStorage.uploadFile(file, args)
}

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

        if (params.cover.startsWith("http")) {
            try {
                this.analyzeCoverColor()
            } catch (error) {
                // so bad...
            }
        }

        return this
    }

    uid = null

    cover = "https://storage.ragestudio.net/comty-static-assets/default_song.png"

    title = "Untitled"

    album = "Unknown"

    artist = "Unknown"

    source = null

    metadata = {}

    lyrics_enabled = false

    analyzedMetadata = null

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
                    const coverUpload = await uploadBinaryArrayToStorage(this.metadata.tags.picture)

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
}