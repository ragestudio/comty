//@ts-ignore
import { OauthCode } from "@db_models"

export default async function () {
	try {
		await OauthCode.collection.dropIndex("expiresAt_1")
	} catch (_) {}

	await OauthCode.collection.createIndex(
		{ expiresAt: 1 },
		{ expireAfterSeconds: 0, background: true },
	)
}
