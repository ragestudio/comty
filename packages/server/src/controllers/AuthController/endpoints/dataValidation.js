import { User } from "@models"

export default {
    method: "GET",
    route: "/login/validation",
    fn: async function (req, res) {
        // just check if the provided user or/and email exists, if is return false, otherwise return true
        const { username, email } = req.query

        if (!username && !email) {
            return res.status(400).json({
                message: "Missing username or email",
            })
        }

        const user = await User.findOne({
            $or: [
                { username: username },
                { email: email },
            ]
        }).catch((error) => {
            return false
        })

        if (user) {
            return res.json({
                message: "User already exists",
                exists: true,
            })
        } else {
            return res.json({
                message: "User doesn't exists",
                exists: false,
            })
        }
    }
}