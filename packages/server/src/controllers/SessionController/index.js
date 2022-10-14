import { Controller } from "linebridge/dist/server"
import jwt from "jsonwebtoken"

import { Session } from "../../models"
import { Token } from "../../lib"

export default class SessionController extends Controller {
    static refName = "SessionController"

    get = {
        "/sessions": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                // get current session _id
                const { _id } = req.user
                const sessions = await Session.find({ user_id: _id }, { token: 0 })

                return res.json(sessions)
            },
        },
        "/current_session": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                return res.json(req.currentSession)
            }
        },
    }

    post = {
        "/validate_session": {
            middlewares: ["useJwtStrategy"],
            fn: async (req, res) => {
                const token = req.body.session

                let result = {
                    expired: false,
                    valid: true
                }

                await jwt.verify(token, req.jwtStrategy.secretOrKey, async (err, decoded) => {
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

                return res.json(result)
            },
        },
        "/regenerate_session_token": {
            middlewares: ["useJwtStrategy"],
            fn: async (req, res) => {
                const { expiredToken, refreshToken } = req.body

                const token = await Token.regenerateSession(expiredToken, refreshToken).catch((error) => {
                    res.status(400).json({ error: error.message })

                    return null
                })

                if (!token) return

                return res.json({ token })
            },
        }
    }

    delete = {
        "/session": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                const { token, user_id } = req.body

                if (typeof user_id === "undefined") {
                    return res.status(400).json("No user_id provided")
                }
                if (typeof token === "undefined") {
                    return res.status(400).json("No token provided")
                }

                const session = await Session.findOneAndDelete({ user_id, token })
                if (session) {
                    return res.json("done")
                }

                return res.status(404).json("not found")
            },
        },
        "/sessions": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                const { user_id } = req.body

                if (typeof user_id === "undefined") {
                    return res.status(400).json("No user_id provided")
                }

                const allSessions = await Session.deleteMany({ user_id })
                if (allSessions) {
                    return res.json("done")
                }

                return res.status(404).json("not found")
            }
        },
    }
}