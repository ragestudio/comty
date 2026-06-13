//@ts-ignore
import { OidcApp } from "@db_models"

export default async function (userId: string, clientId: string) {
	const result = await OidcApp.deleteOne({
		client_id: clientId,
		owner_id: userId,
	})

	if (result.deletedCount === 0) {
		throw new OperationError(404, "App not found")
	}
}
