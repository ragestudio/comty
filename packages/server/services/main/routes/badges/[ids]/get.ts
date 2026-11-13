import type API from "@services/main/main.service"
import Badge from "@db_models/badge"

const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i

type RouteParams = {
	ids: string
}

export default defineRoute<API>()({
	fn: async (req) => {
		const { ids } = req.params as RouteParams

		const idsList = ids
			.split(",")
			.map((id) => id.trim())
			.filter(Boolean)

		if (!idsList.length) return []

		const objectIds = idsList.filter((id) => OBJECT_ID_REGEX.test(id))
		const names = idsList.filter((id) => !OBJECT_ID_REGEX.test(id))

		const query: Record<string, any> = {
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

		return idsList
			.map((id) => byId.get(id) ?? byName.get(id))
			.filter(Boolean)
	},
})
