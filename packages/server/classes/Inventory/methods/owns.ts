import type Inventory from "../index"
import type {
	CatalogItem,
	InventoryEntry,
	InventoryEntryWithItem,
} from "../types"

import InventoryItem from "@db_models/inventoryItem"

export default async function (
	this: typeof Inventory,
	user_id: string,
	kind: string,
	item_ids: Array<string | any>,
): Promise<InventoryEntryWithItem[]> {
	if (!this.isKind(kind)) return []

	const ids = [...new Set(item_ids.map(String).filter(Boolean))]

	if (!ids.length) return []

	const entries = (await InventoryItem.find({
		user_id: String(user_id),
		kind,
		item_id: { $in: ids },
	}).lean()) as unknown as InventoryEntry[]

	const items = await this.getItems(kind, ids)

	return entries
		.filter((entry) => items.has(String(entry.item_id)))
		.map((entry) => ({
			...entry,
			item: items.get(String(entry.item_id)) as CatalogItem,
		}))
}
