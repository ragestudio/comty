import type { OidcApp } from "@db_models/oidc_apps"
import OidcAppModel from "@db_models/oidc_apps"

export default async function (clientId: string, clientSecret?: string) {
	const client = (await OidcAppModel.findOne({ client_id: clientId })
		.select("+client_secret")
		.lean()) as unknown as OidcApp

	if (!client) {
		return null
	}

	if (clientSecret && client.client_secret !== clientSecret) {
		return null
	}

	return {
		client_id: client.client_id,
		client_name: client.client_name,
		redirect_uris: client.redirect_uris,
		owner_id: client.owner_id,
		production: client.production,
	}
}
