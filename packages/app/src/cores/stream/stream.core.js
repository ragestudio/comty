import Core from "evite/src/core"

import remotes from "comty.js/remotes"
import PlaylistModel from "comty.js/models/playlists"

export default class StreamPlayer extends Core {
    static refName = "stream"
    static namespace = "stream"
    static dependencies = [
        "settings"
    ]

    queue = []
    prevQueue = []

    public = {
        start: this.start.bind(this),
        playback: {
            play: this.playback_play.bind(this),
            pause: this.playback_pause.bind(this),
            seek: this.playback_seek.bind(this),
        },
    }

    async onInitialize() {
        //this.audioContext.resume()
    }

    playback_play() {
        this.streamPlayer.resume()
    }

    playback_pause() {
        this.streamPlayer.pause()
    }

    playback_seek(time) {
        this.streamPlayer.seek(time)
    }

    async createInstance(payload) {
        // if payload is a string its means is a track_id, try to fetch it
        if (typeof payload === "string") {
            payload = await PlaylistModel.getTrack(payload)
        }

        const instanceObj = {
            streamSource: payload.source.split("//")[1].split("/").slice(2).join("/"),
            source: payload.source,
            metadata: {
                title: payload.title,
                album: payload.album,
                artist: payload.artist,
                cover: payload.cover ?? payload.thumbnail,
                ...payload.metadata,
            },
            audioBuffer: this.audioContext.createBuffer(2, this.audioContext.sampleRate * 2, 48000),
            media: this.audioContext.createBufferSource(),
        }

        console.log(instanceObj)

        return instanceObj
    }

    async start(
        instance,
        {
            time = 0
        } = {}
    ) {
        instance = await this.createInstance(instance)

        this.queue = [instance]

        this.prevQueue = []

        this.play(this.queue[0], {
            time: time,
        })
    }


    async play(instance) {

    }
}