//@ts-ignore
import { OauthCode } from "@db_models"
import { generateCode, validateScopes, CODE_EXPIRY_SECONDS } from "../utils"

export default async function (params: {
	client_id: string
	user_id: string
	redirect_uri: string
	scope: string
	code_challenge?: string
	code_challenge_method?: string
}): Promise<string> {
	const code = generateCode()

	await new OauthCode({
		code,
		client_id: params.client_id,
		user_id: params.user_id,
		redirect_uri: params.redirect_uri,
		scope: validateScopes(params.scope),
		code_challenge: params.code_challenge,
		code_challenge_method: params.code_challenge_method,
		expiresAt: new Date(Date.now() + CODE_EXPIRY_SECONDS * 1000),
	}).save()

	return code
}
