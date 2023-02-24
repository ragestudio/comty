import { Track } from "@models"

export default {
    route: "/:id",
    method: "GET",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const track = await Track.findById(req.params.id).catch((err) => false)

        if (!track) {
            return res.status(404).json({
                error: "Track not found"
            })
        }

        return res.json(track)
    }
}