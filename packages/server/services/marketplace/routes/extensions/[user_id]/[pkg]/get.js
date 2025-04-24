import ExtensionClass from "@classes/extension"

export default async (req) => {
	const { user_id, pkg } = req.params

	return await ExtensionClass.resolve({
		user_id,
		pkg,
	})
}
