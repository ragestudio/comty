//@ts-ignore
import { OidcApp } from "@db_models"

export default async function (userId: string) {
	return await OidcApp.find({ owner_id: userId }).lean()
}
