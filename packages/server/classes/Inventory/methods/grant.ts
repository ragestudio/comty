import type Inventory from "../index"
import type {
	CatalogItem,
	GrantInventoryItemParams,
	InventoryEntry,
	InventoryEntryWithItem,
	InventoryKind,
} from "../types"

import InventoryItem from "@db_models/inventoryItem"

export default async function (
	this: typeof Inventory,
	{
		user_id,
		kind,
		item_id,
		source = "system",
		granted_by = null,
		metadata = {},
	}: GrantInventoryItemParams,
): Promise<InventoryEntryWithItem> {
	if (!user_id) {
		throw new OperationError(400, "Missing user_id")
	}

	const item: CatalogItem = await this.assertItem(kind, item_id)

	const entry: InventoryEntry = {
		user_id: String(user_id),
		kind: kind as InventoryKind,
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
