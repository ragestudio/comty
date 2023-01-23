import { Session, User } from "../../models"
import { Token } from "../../lib"
import jwt from "jsonwebtoken"

export default (req, res, next) => {
    function reject(description) {
        return res.status(403).json({ error: `${description ?? "Invalid session"}` })
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
                return res.status(404).json({ error: "No user data found" })
            }

            // if cannot verify token, start regeneration process
            if (err) {
                // first check if token is only expired, if is corrupted, reject
                if (err.name !== "TokenExpiredError") {
                    return reject("Invalid token, cannot regenerate")
                }

                let regenerationToken = null

                // check if this expired token has a regeneration token associated
                const associatedRegenerationToken = await Token.getRegenerationToken(token)

                if (associatedRegenerationToken) {
                    regenerationToken = associatedRegenerationToken.refreshToken
                } else {
                    // create a new regeneration token with the expired token
                    regenerationToken = await Token.createNewRegenerationToken(token).catch((error) => {
                        // in case of error, reject
                        reject(error.message)

                        return null
                    })
                }

                if (!regenerationToken) return

                // now send the regeneration token to the client (start Expired Exception Event [EEE])
                return res.status(401).json({
                    error: "Token expired",
                    refreshToken: regenerationToken.refreshToken,
                })
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
