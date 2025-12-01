import jwt from "jsonwebtoken"
import { User } from "@db_models"

export default class AuthToken {
	static get SessionModel() {
		return global.scylla.model("auth_session")
	}

	static get authStrategy() {
		return {
			secret: process.env.JWT_SECRET,
			expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
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

	static async basicDecode(token) {
		const { secret } = AuthToken.authStrategy

		return new Promise((resolve, reject) => {
			jwt.verify(token, secret, async (err, decoded) => {
				if (err) {
					reject(err)
				}

				resolve(decoded)
			})
		})
	}

	static async signToken(payload, strategy = "authStrategy") {
		const { secret, expiresIn, algorithm } =
			AuthToken[strategy] ?? AuthToken.authStrategy

		return jwt.sign(payload, secret, {
			expiresIn: expiresIn,
			algorithm: algorithm,
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

		const validation = await AuthToken.jwtVerify(token)

		if (validation.error) {
			result.valid = false
			result.error = validation.error.message

			if (validation.error.message === "jwt expired") {
				result.expired = true
			}

			return result
		}

		const session = await AuthToken.SessionModel.findOneAsync(
			{
				_id: validation.data.session_id,
			},
			{ raw: true },
		)

		// if session not found, return invalid
		if (!session) {
			result.valid = false
			result.error = "Session not found or not valid"
			return result
		}

		// if session token not match, return invalid
		if (session.token !== token) {
			result.valid = false
			result.error = "Session token not match"
			return result
		}

		result.valid = true
		result.session = session
		result.data = validation.data
		result.user = async () => {
			return await User.findById(validation.data.user_id)
		}

		return result
	}

	static async jwtVerify(token) {
		const { secret } = AuthToken.authStrategy

		return await new Promise((resolve) => {
			jwt.verify(token, secret, (err, decoded) => {
				if (err) {
					return resolve({
						error: err,
						data: decoded,
					})
				}

				return resolve({
					error: err,
					data: decoded,
				})
			})
		})
	}
}
