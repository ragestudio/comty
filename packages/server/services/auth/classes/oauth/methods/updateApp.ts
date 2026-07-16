//@ts-ignore
import { OidcApp } from "@db_models"

export default async function (
	userId: string,
	clientId: string,
	params: {
		client_name?: string
		redirect_uris?: string[]
		logo_url?: string
		website_url?: string
		scopes?: string[]
		grant_types?: string[]
	},
) {
	const app = await OidcApp.findOne({
		client_id: clientId,
		owner_id: userId,
	})

	if (!app) {
		throw new Error("not_found")
	}

	if (params.client_name) {
		app.client_name = params.client_name
	}
	if (params.redirect_uris) {
		app.redirect_uris = params.redirect_uris
	}
	if (params.logo_url) {
		app.logo_url = params.logo_url
	}
	if (params.website_url) {
		app.website_url = params.website_url
	}
	if (params.scopes) {
		app.scopes = params.scopes
	}
	if (params.grant_types) {
		app.grant_types = params.grant_types
	}

	await app.save()

	return { client_id: app.client_id, client_name: app.client_name }
}
