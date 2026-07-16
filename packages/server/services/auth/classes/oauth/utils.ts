import crypto from "node:crypto"

const SUPPORTED_SCOPES = ["openid", "profile", "email"]

export const CODE_EXPIRY_SECONDS = 60

export function parseExpiresIn(value: string): number {
	const match = value.match(/^(\d+)(s|m|h|d)$/)
	if (!match) return 3600
	const num = parseInt(match[1], 10)
	switch (match[2]) {
		case "s":
			return num
		case "m":
			return num * 60
		case "h":
			return num * 3600
		case "d":
			return num * 86400
		default:
			return 3600
	}
}

export function generateCode() {
	return crypto.randomBytes(32).toString("hex")
}

export function generateClientId() {
	return crypto.randomBytes(16).toString("hex")
}

export function generateClientSecret() {
	return crypto.randomBytes(32).toString("hex")
}

export function validateScopes(requested: string): string {
	const scopes = (requested || "")
		.split(" ")
		.map((s) => s.trim())
		.filter(Boolean)

	const valid = scopes.filter((s) => SUPPORTED_SCOPES.includes(s))

	if (!valid.includes("openid")) {
		valid.unshift("openid")
	}

	return valid.join(" ")
}

export function buildClaims(user: any, scope: string): Record<string, any> {
	const scopes = scope.split(" ")

	const claims: Record<string, any> = {
		sub: user._id.toString(),
	}

	if (scopes.includes("email")) {
		claims.email = user.email.toString()
	}

	if (scopes.includes("profile")) {
		claims.username = user.username.toString()

		if (user.public_name) {
			claims.name = user.public_name.toString()
		} else {
			claims.name = user.username.toString()
		}

		if (user.flags) {
			claims.flags = user.flags
		}
	}

	return claims
}
