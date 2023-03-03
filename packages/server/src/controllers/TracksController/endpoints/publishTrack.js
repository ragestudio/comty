import { Track } from "@models"

export default {
    method: "POST",
    route: "/publish",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        let {
            title,
            thumbnail,
            metadata,
            source,
        } = req.body

        if (!title || !source) {
            return res.status(400).json({
                error: "title and source are required"
            })
        }

        const track = new Track({
            user_id: req.user._id.toString(),
            title,
            thumbnail,
            metadata,
            source,
        })

        await track.save()

        return res.json(track)
    }
}