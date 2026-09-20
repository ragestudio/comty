import Badge from "@db_models/badge"

export default async (req) => {
	let { ids } = req.params

	ids = ids.split(",")

	return await Badge.find({
		name: {
			$in: ids,
		},
	})
}
