import { Track } from "@db_models"
import requiredFields from "@shared-utils/requiredFields"
import MusicMetadata from "music-metadata"
import axios from "axios"

import ModifyTrack from "./modify"

export default async (payload = {}) => {
    requiredFields(["title", "source", "user_id"], payload)

    let stream = null
    let headers = null

    if (typeof payload._id === "string") {
        return await ModifyTrack(payload._id, payload)
    }

    let metadata = Object()

    try {
        const sourceStream = await axios({
            url: payload.source,
            method: "GET",
            responseType: "stream",
        })

        stream = sourceStream.data
        headers = sourceStream.headers

        const streamMetadata = await MusicMetadata.parseStream(stream, {
            mimeType: headers["content-type"],
        })

        metadata = {
            ...metadata,
            format: streamMetadata.format.codec,
            channels: streamMetadata.format.numberOfChannels,
            sampleRate: streamMetadata.format.sampleRate,
            bits: streamMetadata.format.bitsPerSample,
            lossless: streamMetadata.format.lossless,
            duration: streamMetadata.format.duration,

            title: streamMetadata.common.title,
            artists: streamMetadata.common.artists,
            album: streamMetadata.common.album,
        }
    } catch (error) {
        // sowy :(
    }

    if (typeof payload.metadata === "object") {
        metadata = {
            ...metadata,
            ...payload.metadata,
        }
    }

    metadata.format = metadata.format.toUpperCase()

    if (
        metadata.format === "FLAC" || 
        metadata.format === "WAV" || 
        metadata.format === "ALAC"
    ) {
        metadata.lossless = true
    }

    const obj = {
        title: payload.title,
        album: payload.album,
        cover: payload.cover,
        artists: [],
        source: payload.source,
        metadata: metadata,
        lyrics_enabled: payload.lyrics_enabled,
    }

    if (Array.isArray(payload.artists)) {
        obj.artists = payload.artists
    }

    if (typeof payload.artists === "string") {
        obj.artists.push(payload.artists)
    }

    if (typeof payload.artist === "string") {
        obj.artists.push(payload.artist)
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