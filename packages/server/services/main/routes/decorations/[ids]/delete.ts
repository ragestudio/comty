import type API from "@services/main/main.service"
import Decoration from "@db_models/decorations"
import InventoryItem from "@db_models/inventoryItem"
import User from "@db_models/user"

type RouteParams = {
	ids: string
}

const SLOT_ALIASES: Record<string, string> = {
	profile_font: "font",
	custom_font: "font",
	member_background: "member_bg",
	avatar: "avatar_frame",
	user_card: "user_card_bg",
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		const { ids } = req.params as RouteParams

		const idsList = ids
			.split(",")
			.map((id) => id.trim())
			.filter(Boolean)

		let deleted = 0

		for (const id of idsList) {
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
				const slot = SLOT_ALIASES[decoration.type] ?? decoration.type

				await User.updateMany(
					{ [`decorations.${slot}`]: decorationId },
					{ $unset: { [`decorations.${slot}`]: "" } },
				)
			}

			deleted++
		}

		return { ok: true, deleted }
	},
})
