import { Playlist } from "@models"

const allowedUpdateFields = [
    "title",
    "description",
    "thumbnail",
    "list",
]

export default {
    method: "PUT",
    route: "/:playlist_id",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const { payload } = req.body

        if (!payload) {
            return res.status(400).json({
                message: "Payload is required"
            })
        }

        let playlist = await Playlist.findById(req.params.playlist_id).catch((err) => false)

        if (!playlist) {
            return res.status(404).json({
                message: "Playlist not found"
            })
        }

        // check if the user is the owner of the playlist
        if (req.user._id.toString() !== playlist.user_id.toString()) {
            return res.status(403).json({
                message: "You are not the owner of this playlist"
            })
        }

        console.log(payload)

        // update the playlist
        allowedUpdateFields.forEach((key) => {
            playlist[key] = payload[key] || playlist[key]
        })

        await playlist.save()

        return res.json(playlist)
    }
}