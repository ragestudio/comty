import { Track } from "@db_models"
import requiredFields from "@shared-utils/requiredFields"
import MusicMetadata from "music-metadata"
import axios from "axios"

export default async (payload = {}) => {
    requiredFields(["title", "source", "user_id"], payload)

    const { data: stream, headers } = await axios({
        url: payload.source,
        method: "GET",
        responseType: "stream",
    })

    const fileMetadata = await MusicMetadata.parseStream(stream, {
        mimeType: headers["content-type"],
    })

    const metadata = {
        format: fileMetadata.format.codec,
        channels: fileMetadata.format.numberOfChannels,
        sampleRate: fileMetadata.format.sampleRate,
        bits: fileMetadata.format.bitsPerSample,
        lossless: fileMetadata.format.lossless,
        duration: fileMetadata.format.duration,

        title: fileMetadata.common.title,
        artists: fileMetadata.common.artists,
        album: fileMetadata.common.album,
    }

    if (typeof payload.metadata === "object") {
        metadata = {
            ...metadata,
            ...payload.metadata,
        }
    }

    const obj = {
        title: payload.title,
        album: payload.album,
        cover: payload.cover,
        artists: [],
        source: payload.source,
        metadata: metadata,
    }

    if (Array.isArray(payload.artists)) {
        obj.artists = payload.artists
    }

    if (typeof payload.artists === "string") {
        obj.artists.push(payload.artists)
    }

    if (obj.artists.length === 0 || !obj.artists) {
        obj.artists = metadata.artists
    }

    let track = null

    if (payload._id) {
        track = await Track.findById(payload._id)

        if (!track) {
            throw new OperationError(404, "Track not found, cannot update")
        }

        throw new OperationError(501, "Not implemented")
    } else {
        track = new Track({
            ...obj,
            publisher: {
                user_id: payload.user_id,
            }
        })

        await track.save()
    }

    track = track.toObject()

    return track
}