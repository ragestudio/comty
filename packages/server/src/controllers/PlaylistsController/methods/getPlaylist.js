import { User, Playlist } from "../../../models"

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

    return playlist
}