import type Inventory from "../index"
import type { RevokeInventoryItemParams } from "../types"

import InventoryItem from "@db_models/inventoryItem"
import User from "@db_models/user"

export default async function (
	this: typeof Inventory,
	{ user_id, kind, item_id }: RevokeInventoryItemParams,
) {
	if (!user_id || !kind || !item_id) {
		throw new OperationError(400, "Missing inventory revoke fields")
	}

	const stringItemId = String(item_id)

	const result = await InventoryItem.deleteOne({
		user_id: String(user_id),
		kind,
		item_id: stringItemId,
	})

	if (kind === "badge") {
		await User.updateOne(
			{ _id: user_id },
			{ $pull: { profile_badges: stringItemId } },
		)
	}

	if (kind === "decoration") {
		const user = await User.findById(user_id).lean()

		if (user?.decorations) {
			const decorations = { ...user.decorations }
			let changed = false

			for (const [slot, id] of Object.entries(decorations)) {
				if (String(id) === stringItemId) {
					delete decorations[slot]
					changed = true
				}
			}

			if (changed) {
				await User.updateOne(
					{ _id: user_id },
					{ $set: { decorations } },
				)
			}
		}
	}

	await this.emitUserUpdate(user_id)

	return result
}
