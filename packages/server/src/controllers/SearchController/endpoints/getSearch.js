import { User } from "@models"

export default {
    method: "GET",
    route: "/",
    middlewares: ["withOptionalAuthentication"],
    fn: async (req, res) => {
        const { keywords = "" } = req.query

        let suggestions = {}

        // search users by username or name
        const users = await User.find({
            $or: [
                { username: { $regex: keywords, $options: "i" } },
                { fullName: { $regex: keywords, $options: "i" } },
            ],
        })
            .limit(5)
            .select("username fullName avatar verified")

        if (users.length > 0) {
            suggestions["users"] = users
        }

        return res.json(suggestions)
    }
}