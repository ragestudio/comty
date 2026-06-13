//@ts-ignore
import { OidcApp } from "@db_models"
import { generateClientId, generateClientSecret } from "../utils"

export default async function (
	userId: string,
	params: {
		client_name: string
		redirect_uris: string[]
		scopes?: string[]
	},
) {
	const clientId = generateClientId()
	const clientSecret = generateClientSecret()

	await new OidcApp({
		client_id: clientId,
		client_secret: clientSecret,
		client_name: params.client_name,
		owner_id: userId,
		redirect_uris: params.redirect_uris,
		grant_types: ["authorization_code", "refresh_token"],
		response_types: ["code"],
		scopes: params.scopes || [],
	}).save()

	return { client_id: clientId, client_secret: clientSecret }
}
