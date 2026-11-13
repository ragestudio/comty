import Decoration from "@db_models/decorations"
import InventoryItem from "@db_models/inventoryItem"
import User from "@db_models/user"

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
			const decoration = await Decoration.findById(id).lean()

			if (!decoration) continue

			const decorationId = String(decoration._id)

			await Decoration.updateOne(
				{ _id: decoration._id },
				{ enabled: false, deleted_at: new Date() },
			)

			await InventoryItem.deleteMany({
				kind: "decoration",
				item_id: decorationId,
			})

			if (decoration.type) {
				await User.updateMany(
					{ [`decorations.${decoration.type}`]: decorationId },
					{ $unset: { [`decorations.${decoration.type}`]: "" } },
				)
			}

			deleted++
		}

		return { ok: true, deleted }
	},
}
