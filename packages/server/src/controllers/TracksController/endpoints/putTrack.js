import createOrUpdateTrack from "../services/createOrUpdateTrack"

export default {
    method: "POST",
    route: "/",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const result = await createOrUpdateTrack({
            user_id: req.user._id.toString(),
            ...req.body,
        })

        return res.json(result)
    }
}