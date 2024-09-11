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

        return this
    }

    audio = null

    contextElement = null

    abortController = new AbortController()

    attachedProcessors = []

    waitUpdateTimeout = null

    resolveManifest = async () => {
        if (typeof this.manifest === "string") {
            this.manifest = {
                src: this.manifest,
            }
        }

        if (this.manifest.service) {
            if (!this.player.service_providers.has(manifest.service)) {
                throw new Error(`Service ${manifest.service} is not supported`)
            }

            // try to resolve source file
            if (this.manifest.service !== "inherit" && !this.manifest.source) {
                this.manifest = await this.player.service_providers.resolve(this.manifest.service, this.manifest)
            }
        }

        if (!this.manifest.source) {
            throw new Error("Manifest `source` is required")
        }

        if (!this.manifest.metadata) {
            this.manifest.metadata = {}
        }

        if (!this.manifest.metadata.title) {
            this.manifest.metadata.title = this.manifest.source.split("/").pop()
        }

        return this.manifest
    }

    initialize = async () => {
        this.manifest = await this.resolveManifest()

        this.audio = new Audio(this.manifest.source)

        this.audio.signal = this.abortController.signal
        this.audio.crossOrigin = "anonymous"
        this.audio.preload = "metadata"

        for (const [key, value] of Object.entries(this.mediaEvents)) {
            this.audio.addEventListener(key, value)
        }

        this.contextElement = this.player.audioContext.createMediaElementSource(this.audio)

        return this
    }

    mediaEvents = {
        "ended": () => {
            this.player.next()
        },
        "loadeddata": () => {
            this.player.state.loading = false
        },
        "loadedmetadata": () => {
            // TODO: Detect a livestream and change mode
            // if (instance.media.duration === Infinity) {
            //     instance.manifest.stream = true

            //     this.state.livestream_mode = true
            // }
        },
        "play": () => {
            this.player.state.playback_status = "playing"
        },
        "playing": () => {
            this.player.state.loading = false

            this.player.state.playback_status = "playing"

            if (typeof this.waitUpdateTimeout !== "undefined") {
                clearTimeout(this.waitUpdateTimeout)
                this.waitUpdateTimeout = null
            }
        },
        "pause": () => {
            this.player.state.playback_status = "paused"
        },
        // "durationchange": (duration) => {

        // },
        "waiting": () => {
            if (this.waitUpdateTimeout) {
                clearTimeout(this.waitUpdateTimeout)
                this.waitUpdateTimeout = null
            }

            // if takes more than 150ms to load, update loading state
            this.waitUpdateTimeout = setTimeout(() => {
                this.player.state.loading = true
            }, 150)
        },
        "seeked": () => {
            this.player.eventBus.emit(`player.seeked`, this.audio.currentTime)
        },
    }
}