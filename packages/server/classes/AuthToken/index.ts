import type { DecodedAuthToken } from "@comty/shared/types/session"
import type { User as I_User } from "@comty/shared/types/user"
import type { Algorithm, PrivateKey, SignOptions } from "jsonwebtoken"
import type { InferDoc } from "@ragestudio/scylla-odm/types"

import jwt from "jsonwebtoken"
import User from "@db_models/user"
import AuthSessionModel from "@db/auth_session"

export const JWT_ALGORITHM = (process.env.JWT_ALGORITHM ??
	"ES256") as unknown as Algorithm
export const SIGN_OPTIONS: Record<string, SignOptions> = {
	auth: {
		// @ts-ignore
		expiresIn: String(process.env.JWT_EXPIRES_IN ?? "1h"),
		algorithm: JWT_ALGORITHM,
		header: {
			kid: String(process.env.JWT_KID),
			alg: JWT_ALGORITHM,
		},
	},
	refresh: {
		// @ts-ignore
		expiresIn: String(process.env.JWT_REFRESH_EXPIRES_IN ?? "30d"),
		algorithm: JWT_ALGORITHM,
		header: {
			kid: String(process.env.JWT_KID),
			alg: JWT_ALGORITHM,
		},
	},
}

export class AuthToken {
	static async basicDecode(token) {
		return new Promise((resolve, reject) => {
			jwt.verify(
				token,
				process.env.ECDSA_PRIVATE_KEY,
				{
					algorithms: [JWT_ALGORITHM],
				},
				async (err, decoded) => {
					if (err) {
						reject(err)
					}

					resolve(decoded)
				},
			)
		})
	}

	static async loadECDSAFromEnvB64() {
		process.env.ECDSA_PRIVATE_KEY = Buffer.from(
			process.env.ECDSA_PRIVATE_KEY_B64,
			"base64",
		).toString("utf-8")

		process.env.ECDSA_PUBLIC_KEY = Buffer.from(
			process.env.ECDSA_PUBLIC_KEY_B64,
			"base64",
		).toString("utf-8")
	}

	static async signToken(
		payload: DecodedAuthToken,
		strategy: keyof typeof SIGN_OPTIONS = "auth",
	): Promise<string> {
		console.log("signing token with alg:", JWT_ALGORITHM)
		return jwt.sign(
			payload,
			process.env.ECDSA_PRIVATE_KEY as PrivateKey,
			SIGN_OPTIONS[strategy],
		)
	}

	static async validate(token: string) {
		let result: {
			expired: boolean
			valid: boolean
			error: null | string
			data: null | DecodedAuthToken
			session: null | InferDoc<typeof AuthSessionModel>
			user: null | (() => Promise<I_User>)
		} = {
			expired: false,
			valid: true,
			error: null,
			data: null,
			session: null,
			user: null,
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

		const session = await AuthSessionModel.findOne(
			{
				_id: validation.data.session_id,
				user_id: validation.data.user_id,
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

	static async jwtVerify(
		token: string,
	): Promise<{ error?: any; data: DecodedAuthToken }> {
		return await new Promise((resolve) => {
			jwt.verify(
				token,
				process.env.ECDSA_PRIVATE_KEY,
				{
					algorithms: [JWT_ALGORITHM],
				},
				(err, decoded) => {
					if (err) {
						return resolve({
							error: err,
							data: decoded as DecodedAuthToken,
						})
					}

					return resolve({
						error: err,
						data: decoded as DecodedAuthToken,
					})
				},
			)
		})
	}
}

export default AuthToken
