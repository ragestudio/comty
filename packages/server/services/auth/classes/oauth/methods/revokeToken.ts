import AuthToken from "@shared-classes/AuthToken"

export default async function (token: string) {
	const validation = await AuthToken.validate(token)

	if (validation.valid && validation.session) {
		await validation.session.deleteOne()
	}
}
