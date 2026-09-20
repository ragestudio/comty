import OidcAppModel from "@db_models/oidc_apps"

export default async function (userId: string) {
	return await OidcAppModel.find({ owner_id: userId }).lean()
}
