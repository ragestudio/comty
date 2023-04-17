import { Track } from "@models"

const allowedUpdateFields = [
    "title",
    "thumbnail",
    "album",
    "artist",
    "explicit",
]

export default async (payload) => {
    if (!payload.title || !payload.source || !payload.user_id) {
        throw new Error("title and source and user_id are required")
    }

    let track = null

    if (payload._id) {
        track = await Track.findById(payload._id)

        if (!track) {
            throw new Error("track not found")
        }

        allowedUpdateFields.forEach((field) => {
            if (typeof payload[field] !== "undefined") {
                track[field] = payload[field]
            }
        })

        track = await Track.findByIdAndUpdate(payload._id, track)

        if (!track) {
            throw new Error("Failed to update track")
        }
    } else {
        track = new Track(payload)

        await track.save()
    }

    return track
}