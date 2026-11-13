import type API from "@services/users/users.service"

import User from "@db_models/user"
import Inventory from "@shared-classes/Inventory"

const DECORATION_SLOTS = ["user_card_bg", "avatar_frame", "member_bg"]

const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i

type RouteBody = {
	decorations?: Record<string, string | null>
}

type OwnedEntry = {
	item_id: string
	item: any
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const userId = req.auth.session.user_id
		const { decorations } = (req.body ?? {}) as RouteBody

		if (
			!decorations ||
			typeof decorations !== "object" ||
			Array.isArray(decorations)
		) {
			throw new OperationError(400, "Invalid decorations update")
		}

		const update: Record<string, string> = {}

		for (const [slot, id] of Object.entries(decorations)) {
			if (!DECORATION_SLOTS.includes(slot)) continue

			if (!id) continue

			const decorationId = String(id)

			if (!OBJECT_ID_REGEX.test(decorationId)) {
				throw new OperationError(
					400,
					`Invalid decoration id: ${decorationId}`,
				)
			}

			update[slot] = decorationId
		}

		const ownedEntries = (await Inventory.owns(
			userId,
			"decoration",
			Object.values(update),
		)) as unknown as OwnedEntry[]

		const owned = new Map<string, any>()

		for (const entry of ownedEntries) {
			owned.set(String(entry.item_id), entry.item)
		}

		for (const id of Object.values(update)) {
			if (!owned.get(id)) {
				throw new OperationError(403, "You do not own this decoration")
			}
		}

		const user = await User.findByIdAndUpdate(
			userId,
			{ decorations: update },
			{ new: true },
		).lean()

		if (!user) {
			throw new OperationError(404, "User not found")
		}

		await Inventory.emitUserUpdate(userId)

		return {
			decorations: update,
		}
	},
})
