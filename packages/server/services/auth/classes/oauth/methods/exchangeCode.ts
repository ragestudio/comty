import crypto from "node:crypto"
//@ts-ignore
import { OauthCode } from "@db_models"
import AuthToken from "@shared-classes/AuthToken"
import { parseExpiresIn } from "../utils"

export default async function (params: {
	code: string
	client_id: string
	client_secret: string
	redirect_uri: string
	code_verifier?: string
}) {
	const stored = await OauthCode.findOne({ code: params.code })

	if (!stored) {
		throw new Error("invalid_grant")
	}

	if (stored.used) {
		await OauthCode.deleteOne({ code: params.code })
		throw new Error("invalid_grant")
	}

	if (stored.expiresAt < new Date()) {
		await OauthCode.deleteOne({ code: params.code })
		throw new Error("invalid_grant")
	}

	if (stored.client_id !== params.client_id) {
		throw new Error("invalid_grant")
	}

	if (stored.redirect_uri !== params.redirect_uri) {
		throw new Error("invalid_grant")
	}

	if (stored.code_challenge) {
		if (!params.code_verifier) {
			throw new Error("invalid_grant")
		}

		const method = stored.code_challenge_method || "S256"
		let computed: string

		if (method === "S256") {
			computed = crypto
				.createHash("sha256")
				.update(params.code_verifier)
				.digest("base64url")
		} else if (method === "plain") {
			computed = params.code_verifier
		} else {
			throw new Error("invalid_grant")
		}

		if (computed !== stored.code_challenge) {
			throw new Error("invalid_grant")
		}
	}

	stored.used = true
	await stored.save()

	const accessToken = await AuthToken.signToken(
		{
			user_id: stored.user_id,
			client_id: stored.client_id,
			scope: stored.scope,
			type: "oauth_access",
		},
		"authStrategy",
	)

	const refreshToken = await AuthToken.signToken(
		{
			user_id: stored.user_id,
			client_id: stored.client_id,
			scope: stored.scope,
			type: "oauth_refresh",
		},
		"refreshStrategy",
	)

	return {
		access_token: accessToken,
		token_type: "Bearer",
		expires_in: parseExpiresIn(AuthToken.authStrategy.expiresIn),
		refresh_token: refreshToken,
		scope: stored.scope,
	}
}
