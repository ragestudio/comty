import Badge from "@db_models/badge"

const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i

export default async (req) => {
	let { ids } = req.params

	ids = ids
		.split(",")
		.map((id) => id.trim())
		.filter(Boolean)

	if (!ids.length) return []

	const objectIds = ids.filter((id) => OBJECT_ID_REGEX.test(id))
	const names = ids.filter((id) => !OBJECT_ID_REGEX.test(id))

	const query = {
		enabled: { $ne: false },
	}

	if (objectIds.length && names.length) {
		query.$or = [{ _id: { $in: objectIds } }, { name: { $in: names } }]
	} else if (objectIds.length) {
		query._id = { $in: objectIds }
	} else {
		query.name = { $in: names }
	}

	const badges = await Badge.find(query).lean()

	const byId = new Map(badges.map((badge) => [String(badge._id), badge]))
	const byName = new Map(badges.map((badge) => [badge.name, badge]))

	return ids.map((id) => byId.get(id) ?? byName.get(id)).filter(Boolean)
}
