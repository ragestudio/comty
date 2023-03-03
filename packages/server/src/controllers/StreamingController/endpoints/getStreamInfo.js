import { StreamingInfo, User, StreamingCategory } from "@models"

export default {
    method: "GET",
    route: "/stream/info",
    middleware: ["withAuthentication"],
    fn: async (req, res) => {
        let user_id = req.query.user_id

        if (!req.query.username && !req.query.user_id) {
            return res.status(400).json({
                error: "Invalid request, missing username"
            })
        }

        if (!user_id) {
            const user = await User.findOne({
                username: req.query.username,
            })

            user_id = user._id.toString()
        }

        let info = await StreamingInfo.findOne({
            user_id,
        })

        if (!info) {
            info = new StreamingInfo({
                user_id,
            })

            await info.save()
        }

        return res.json(info.toObject())
    }
}