import { Track, User } from "@models"

export default async (_id) => {
    if (!_id) {
        throw new Error("Missing _id")
    }

    let track = await Track.findById(_id).catch((err) => false)

    if (!track) {
        throw new Error("Track not found")
    }

    track = track.toObject()

    if (!track.metadata) {
        // TODO: Get metadata from source
    }

    const userData = await User.findById(track.user_id).catch((err) => false)

    track.artist = track.artist ?? userData?.fullName ?? userData?.username ?? "Unknown artist"

    return track
}