import jwt from "jsonwebtoken"
import { Session, RefreshToken, User, TosViolations } from "@db_models"

export default class Token {
    static get authStrategy() {
        return {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN ?? "24h",
            algorithm: process.env.JWT_ALGORITHM ?? "HS256",
        }
    }

    static get refreshStrategy() {
        return {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
            algorithm: process.env.JWT_ALGORITHM ?? "HS256",
        }
    }

    static async signToken(payload, strategy = "authStrategy") {
        const { secret, expiresIn, algorithm } = Token[strategy] ?? Token.authStrategy

        const token = jwt.sign(payload,
            secret,
            {
                expiresIn: expiresIn,
                algorithm: algorithm
            }
        )

        return token
    }

    static async createAuthToken(payload) {
        const jwt_token = await this.signToken(payload, "authStrategy")

        const session = new Session({
            token: jwt_token,
            username: payload.username,
            user_id: payload.user_id,
            sign_location: payload.sign_location,
            ip_address: payload.ip_address,
            client: payload.client,
            date: new Date().getTime(),
        })

        await session.save()

        return jwt_token
    }

    static async createRefreshToken(user_id, authToken) {
        const jwt_token = await this.signToken({
            user_id,
        }, "refreshStrategy")

        const refreshRegistry = new RefreshToken({
            authToken: authToken,
            refreshToken: jwt_token,
        })

        await refreshRegistry.save()

        return jwt_token
    }

    static async validate(token) {
        let result = {
            expired: false,
            valid: true,
            error: null,
            data: null,
        }

        if (typeof token === "undefined") {
            result.valid = false
            result.error = "Missing token"

            return result
        }

        const { secret } = Token.authStrategy

        await jwt.verify(token, secret, async (err, decoded) => {
            if (err) {
                result.valid = false
                result.error = err.message

                if (err.message === "jwt expired") {
                    result.expired = true
                }

                return
            }

            result.data = decoded

            // check account tos violation
            const violation = await TosViolations.findOne({ user_id: decoded.user_id })

            if (violation) {
                console.log("violation", violation)

                result.valid = false
                result.banned = {
                    reason: violation.reason,
                    expire_at: violation.expire_at,
                }

                return result
            }

            const sessions = await Session.find({ user_id: decoded.user_id })
            const currentSession = sessions.find((session) => session.token === token)

            if (!currentSession) {
                result.valid = false
                result.error = "Session token not found"
            } else {
                result.session = currentSession
                result.valid = true
                result.user = async () => await User.findOne({ _id: decoded.user_id })
            }
        })

        return result
    }

    static async handleRefreshToken(payload) {
        const { authToken, refreshToken } = payload

        if (!authToken || !refreshToken) {
            throw new OperationError(400, "Missing refreshToken or authToken")
        }

        let result = {
            error: undefined,
            token: undefined,
            refreshToken: undefined,
        }

        await jwt.verify(refreshToken, Token.refreshStrategy.secret, async (err, decoded) => {
            if (err) {
                result.error = err.message
                return false
            }

            if (!decoded.user_id) {
                result.error = "Missing user_id"
                return false
            }

            let currentSession = await Session.findOne({
                user_id: decoded.user_id,
                token: authToken
            }).catch((err) => {
                return null
            })

            if (!currentSession) {
                result.error = "Session not matching with provided token"
                return false
            }

            currentSession = currentSession.toObject()

            await Session.findOneAndDelete({ _id: currentSession._id.toString() })

            result.token = await this.createAuthToken({
                ...currentSession,
                date: new Date().getTime(),
            })
            result.refreshToken = await this.createRefreshToken(decoded.user_id, result.token)

            return true
        })

        if (result.error) {
            throw new OperationError(401, result.error)
        }

        return result
    }
}