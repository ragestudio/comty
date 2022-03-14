import { Session, User } from "../../models"
import { Token } from "../../lib"
import jwt from "jsonwebtoken"

export default (req, res, next) => {
    function reject(description) {
        return res.status(401).send({ error: `${description ?? "Invalid session"}` })
    }

    const authHeader = req.headers?.authorization?.split(" ")

    if (authHeader && authHeader[0] === "Bearer") {
        const token = authHeader[1]
        let decoded = null

        try {
            decoded = jwt.decode(token)
        } catch (error) {
            console.error(error)
        }

        if (!decoded) {
            return reject("Cannot decode token")
        }

        jwt.verify(token, global.jwtStrategy.secretOrKey, async (err) => {
            const sessions = await Session.find({ user_id: decoded.user_id })
            const currentSession = sessions.find((session) => session.token === token)

            if (!currentSession) {
                return reject("Cannot find session")
            }

            const userData = await User.findOne({ _id: currentSession.user_id }).select("+refreshToken")

            if (!userData) {
                return res.status(404).send({ error: "No user data found" })
            }

            if (err) {
                if (decoded.refreshToken === userData.refreshToken) {
                    const regeneratedToken = await Token.createNewAuthToken(userData, {
                        ...global.jwtStrategy,
                        updateSession: currentSession._id,
                    })

                    res.setHeader("regenerated_token", regeneratedToken)
                } else {
                    return reject("Token expired, cannot refresh token either")
                }
            }

            req.user = userData
            req.jwtToken = token
            req.decodedToken = decoded
            req.currentSession = currentSession

            return next()
        })
    } else {
        return reject("Missing token header")
    }
}
