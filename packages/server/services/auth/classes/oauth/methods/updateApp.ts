//@ts-ignore
import { OidcApp } from "@db_models"

export default async function (
	userId: string,
	clientId: string,
	params: {
		client_name?: string
		redirect_uris?: string[]
	},
) {
	const app = await OidcApp.findOne({
		client_id: clientId,
		owner_id: userId,
	})

	if (!app) throw new Error("not_found")

	if (params.client_name) app.client_name = params.client_name
	if (params.redirect_uris) app.redirect_uris = params.redirect_uris

	await app.save()
	return { client_id: app.client_id, client_name: app.client_name }
}
