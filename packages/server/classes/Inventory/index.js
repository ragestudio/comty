import InventoryItem from "@db_models/inventoryItem"
import Decoration from "@db_models/decorations"
import Badge from "@db_models/badge"
import User from "@db_models/user"

const CATALOGS = {
	decoration: Decoration,
	badge: Badge,
}

const KINDS = Object.keys(CATALOGS)

const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i

export default class Inventory {
	static kinds = KINDS

	static isKind(kind) {
		return KINDS.includes(kind)
	}

	static async getItem(kind, item_id) {
		const Model = CATALOGS[kind]

		if (!Model || !item_id) return null

		const id = String(item_id)

		if (!OBJECT_ID_REGEX.test(id)) return null

		return await Model.findOne({
			_id: id,
			enabled: { $ne: false },
		}).lean()
	}

	static async getItems(kind, item_ids) {
		const Model = CATALOGS[kind]

		if (!Model) return new Map()

		const ids = [
			...new Set(
				item_ids.map(String).filter((id) => OBJECT_ID_REGEX.test(id)),
			),
		]

		if (!ids.length) return new Map()

		const items = await Model.find({
			_id: { $in: ids },
			enabled: { $ne: false },
		}).lean()

		return new Map(items.map((item) => [String(item._id), item]))
	}

	static async assertItem(kind, item_id) {
		if (!this.isKind(kind)) {
			throw new OperationError(400, `Invalid inventory kind: ${kind}`)
		}

		const item = await this.getItem(kind, item_id)

		if (!item) {
			throw new OperationError(404, "Inventory item not found")
		}

		return item
	}

	static async grant({
		user_id,
		kind,
		item_id,
		source = "system",
		granted_by = null,
		metadata = {},
	}) {
		if (!user_id) {
			throw new OperationError(400, "Missing user_id")
		}

		const item = await this.assertItem(kind, item_id)

		const entry = {
			user_id: String(user_id),
			kind,
			item_id: String(item_id),
			source,
			granted_by: granted_by ? String(granted_by) : null,
			granted_at: new Date(),
			metadata,
		}

		await InventoryItem.updateOne(
			{
				user_id: entry.user_id,
				kind,
				item_id: entry.item_id,
			},
			{
				$setOnInsert: entry,
			},
			{
				upsert: true,
			},
		)

		return {
			...entry,
			item,
		}
	}

	static async revoke({ user_id, kind, item_id }) {
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

	static async owns(user_id, kind, item_ids) {
		if (!this.isKind(kind)) return []

		const ids = [...new Set(item_ids.map(String).filter(Boolean))]

		if (!ids.length) return []

		const entries = await InventoryItem.find({
			user_id: String(user_id),
			kind,
			item_id: { $in: ids },
		}).lean()

		const items = await this.getItems(kind, ids)

		return entries
			.filter((entry) => items.has(String(entry.item_id)))
			.map((entry) => ({
				...entry,
				item: items.get(String(entry.item_id)),
			}))
	}

	static async list(user_id, { kind, includeOrphaned = false } = {}) {
		if (!user_id) {
			throw new OperationError(400, "Missing user_id")
		}

		if (kind && !this.isKind(kind)) {
			throw new OperationError(400, `Invalid inventory kind: ${kind}`)
		}

		const query = {
			user_id: String(user_id),
		}

		if (kind) query.kind = kind

		const entries = await InventoryItem.find(query)
			.sort({ granted_at: -1 })
			.lean()

		const idsByKind = {}

		for (const entry of entries) {
			idsByKind[entry.kind] ??= []
			idsByKind[entry.kind].push(entry.item_id)
		}

		const itemsByKind = {}

		for (const [entryKind, ids] of Object.entries(idsByKind)) {
			itemsByKind[entryKind] = await this.getItems(entryKind, ids)
		}

		const items = []

		for (const entry of entries) {
			const item = itemsByKind[entry.kind]?.get(String(entry.item_id))

			if (!item && !includeOrphaned) continue

			items.push({
				...entry,
				item: item ?? null,
				unavailable: !item,
			})
		}

		return items
	}

	static async hydrateDecorations(decorations) {
		if (!decorations) return {}

		const items = await this.getItems(
			"decoration",
			Object.values(decorations),
		)

		const hydrated = {}

		for (const [slot, id] of Object.entries(decorations)) {
			const item = items.get(String(id))

			if (item) {
				hydrated[slot] = item
			}
		}

		return hydrated
	}

	static async emitUserUpdate(user_id) {
		if (!global.websockets) return null

		const user = await User.findById(user_id).lean()

		if (!user) return null

		const payload = {
			...user,
			decorations: await this.hydrateDecorations(user.decorations),
		}

		const userSockets = await global.websockets.find.clientsByUserId(
			String(user._id),
		)

		for (const userSocket of userSockets) {
			userSocket.emit("self:user:update", payload)
		}

		return payload
	}
}
