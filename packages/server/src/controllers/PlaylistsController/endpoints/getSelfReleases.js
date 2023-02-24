import { User, Playlist } from "@models"
import getTrackDataById from "../../TracksController/services/getTrackDataById"

export default {
    method: "GET",
    route: "/self",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const user_id = req.user._id.toString()

        let playlists = await Playlist.find({ user_id }).catch((err) => false)

        if (!playlists) {
            throw new Error("Playlists not found")
        }

        playlists = await Promise.all(playlists.map(async (playlist) => {
            playlist.list = await Promise.all(playlist.list.map(async (track_id) => {
                return await getTrackDataById(track_id).catch((err) => null)
            }))

            return playlist
        }))

        return res.json(playlists)
    }
}