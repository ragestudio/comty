import Badge from "@db_models/badge"
import InventoryItem from "@db_models/inventoryItem"
import User from "@db_models/user"

const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i

export default {
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		let { ids } = req.params

		ids = ids
			.split(",")
			.map((id) => id.trim())
			.filter(Boolean)

		let deleted = 0

		for (const id of ids) {
			const query = OBJECT_ID_REGEX.test(id) ? { _id: id } : { name: id }

			const badge = await Badge.findOne(query).lean()

			if (!badge) continue

			const badgeId = String(badge._id)

			await Badge.updateOne(
				{ _id: badge._id },
				{ enabled: false, deleted_at: new Date() },
			)

			await InventoryItem.deleteMany({
				kind: "badge",
				item_id: badgeId,
			})

			await User.updateMany(
				{ profile_badges: badgeId },
				{ $pull: { profile_badges: badgeId } },
			)

			deleted++
		}

		return { ok: true, deleted }
	},
}
