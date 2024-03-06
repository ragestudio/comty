import { Track } from "@db_models"

export default async (_id) => {
    if (!_id) {
        throw new Error("Missing _id")
    }

    let track = await Track.findById(_id).catch((err) => false)

    if (!track) {
        throw new Error("Track not found")
    }

    track = track.toObject()

    track.artist = track.artist ?? "Unknown artist"

    return track
}