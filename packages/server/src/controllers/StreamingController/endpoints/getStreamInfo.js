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
            user_id = await User.findOne({
                username: req.query.username,
            })

            user_id = user_id["_id"].toString()
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

        const category = await StreamingCategory.findOne({
            key: info.category
        }).catch((err) => {
            console.error(err)
            return {}
        }) ?? {}

        return res.json({
            ...info.toObject(),
            ["category"]: {
                key: category?.key ?? "unknown",
                label: category?.label ?? "Unknown",
            }
        })
    }
}