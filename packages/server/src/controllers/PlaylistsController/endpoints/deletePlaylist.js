import { Playlist } from "@models"

export default {
    method: "DELETE",
    route: "/:playlist_id",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const user_id = req.user._id.toString()

        let playlist = await Playlist.findById(req.params.playlist_id).catch((err) => false)

        if (!playlist) {
            return res.status(404).json({
                message: "Playlist not found"
            })
        }

        // check if the user is the owner of the playlist
        if (user_id !== playlist.user_id.toString()) {
            return res.status(403).json({
                message: "You are not the owner of this playlist"
            })
        }

        await playlist.delete()

        return res.json({ message: "Playlist deleted" })
    }
}