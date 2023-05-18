import jwt from "jsonwebtoken"

import { Session } from "@models"

export default {
    method: "POST",
    route: "/validate",
    fn: async (req, res) => {
        const token = req.body.token

        let result = {
            expired: false,
            valid: true,
            session: null
        }

        await jwt.verify(token, global.jwtStrategy.secretOrKey, async (err, decoded) => {
            if (err) {
                result.valid = false
                result.error = err.message

                if (err.message === "jwt expired") {
                    result.expired = true
                }

                return
            }

            result = { ...result, ...decoded }

            const sessions = await Session.find({ user_id: result.user_id })
            const sessionsTokens = sessions.map((session) => {
                if (session.user_id === result.user_id) {
                    return session.token
                }
            })

            if (!sessionsTokens.includes(token)) {
                result.valid = false
                result.error = "Session token not found"
            } else {
                result.valid = true
            }
        })

        if (result.valid) {
            result.session = await jwt.decode(token)
        }

        return res.json(result)
    },
}