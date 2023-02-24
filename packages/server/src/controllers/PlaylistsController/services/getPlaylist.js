import { User, Playlist } from "@models"
import getTrackDataById from "../../TracksController/services/getTrackDataById"

export default async (payload) => {
    const { _id } = payload

    if (!_id) {
        throw new Error("Missing _id")
    }

    let playlist = await Playlist.findById(_id).catch((err) => false)

    if (!playlist) {
        throw new Error("Playlist not found")
    }

    playlist = playlist.toObject()

    const user = await User.findById(playlist.user_id).catch((err) => false)

    if (!user) {
        throw new Error("User not found")
    }

    playlist.user = {
        username: user.username,
        avatar: user.avatar,
    }

    playlist.list = await Promise.all(playlist.list.map(async (track_id) => {
        return await getTrackDataById(track_id)
    }))

    playlist.artist = user.fullName ?? user.username

    return playlist
}