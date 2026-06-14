//@ts-ignore
import { OidcApp } from "@db_models"
import { generateClientSecret } from "../utils"

export default async function (userId: string, clientId: string) {
	const app = await OidcApp.findOne({
		client_id: clientId,
		owner_id: userId,
	}).select("+client_secret")

	if (!app) throw new Error("not_found")

	const newSecret = generateClientSecret()
	app.client_secret = newSecret
	await app.save()

	return { client_secret: newSecret }
}
