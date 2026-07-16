//@ts-ignore
import { User } from "@db_models"
import AuthToken from "@shared-classes/AuthToken"
import { buildClaims } from "../utils"

export default async function (accessToken: string) {
	const result = await AuthToken.jwtVerify(accessToken)

	if (result.error) {
		throw new Error("invalid_token")
	}

	const data = result.data

	if (data.type !== "oauth_access") {
		throw new Error("invalid_token")
	}

	const user = await User.findById(data.user_id).select("+email").lean()

	if (!user) {
		throw new Error("invalid_token")
	}

	return buildClaims(user, data.scope)
}
