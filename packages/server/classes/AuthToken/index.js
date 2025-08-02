import jwt from "jsonwebtoken"
import { Session, RefreshToken, User } from "@db_models"

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
		const { secret, expiresIn, algorithm } =
			Token[strategy] ?? Token.authStrategy

		const token = jwt.sign(payload, secret, {
			expiresIn: expiresIn,
			algorithm: algorithm,
		})

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
			created_at: new Date().getTime(),
		})

		await session.save()

		return jwt_token
	}

	static async createRefreshToken(user_id, authToken) {
		const jwt_token = await this.signToken(
			{
				user_id,
			},
			"refreshStrategy",
		)

		const refreshRegistry = new RefreshToken({
			authToken: authToken,
			refreshToken: jwt_token,
		})

		await refreshRegistry.save()

		return jwt_token
	}

	static async basicDecode(token) {
		const { secret } = Token.authStrategy

		return new Promise((resolve, reject) => {
			jwt.verify(token, secret, async (err, decoded) => {
				if (err) {
					reject(err)
				}

				resolve(decoded)
			})
		})
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

		const validation = await Token.jwtVerify(token)

		// check account tos violation
		// TODO: please not

		// const violation = await TosViolations.findOne({
		// 	user_id: decoded.user_id,
		// })

		// if (violation) {
		// 	console.log("violation", violation)

		// 	result.valid = false
		// 	result.banned = {
		// 		reason: violation.reason,
		// 		expire_at: violation.expire_at,
		// 	}

		// 	return result
		// }
		//

		if (validation.error) {
			result.valid = false
			result.error = validation.error.message

			if (validation.error.message === "jwt expired") {
				result.expired = true
			}

			return result
		}

		// TODO: please find a better way to check sessions
		const session = await Session.findOne({
			user_id: validation.data.user_id,
			token: token,
		})

		if (!session) {
			result.valid = false

			result.error = "Session token not found"
		} else {
			result.valid = true

			result.session = session
			result.user = async () => {
				return await User.findOne({ _id: validation.data.user_id })
			}
		}

		result.data = validation.data

		return result
	}

	static async handleRefreshToken(payload) {
		const { authToken, refreshToken } = payload

		if (!authToken || !refreshToken) {
			throw new OperationError(
				400,
				"Missing refreshToken or/and authToken",
			)
		}

		let result = {
			error: null,
			token: undefined,
			refreshToken: undefined,
		}

		const validation = await Token.jwtVerify(refreshToken)

		if (validation.error) {
			throw new OperationError(401, validation.error.message)
		}

		if (!validation.data.user_id) {
			throw new OperationError(
				401,
				"Missing user_id on the refresh token",
			)
		}

		let currentSession = await Session.findOne({
			user_id: validation.data.user_id,
			token: authToken,
		})

		if (!currentSession) {
			throw new OperationError(
				401,
				"Session not matching with provided token",
			)
		}

		currentSession = currentSession.toObject()

		await Session.findOneAndDelete({
			_id: currentSession._id.toString(),
		})

		result.token = await this.createAuthToken({
			...currentSession,
			date: new Date().getTime(),
		})

		result.refreshToken = await this.createRefreshToken(
			validation.data.user_id,
			result.token,
		)

		return result
	}

	static async jwtVerify(token) {
		return await new Promise((resolve, reject) => {
			jwt.verify(token, Token.authStrategy.secret, (err, decoded) => {
				if (err) {
					reject(err)
				}

				resolve({
					error: err,
					data: decoded,
				})
			}).catch((error) => {
				reject(error)
			})
		})
	}
}
