import type Inventory from "../index"
import type {
	InventoryEntry,
	InventoryListEntry,
	ListInventoryOptions,
} from "../types"

import InventoryItem from "@db_models/inventoryItem"

export default async function (
	this: typeof Inventory,
	user_id: string,
	{ kind, includeOrphaned = false }: ListInventoryOptions = {},
): Promise<InventoryListEntry[]> {
	if (!user_id) {
		throw new OperationError(400, "Missing user_id")
	}

	if (kind && !this.isKind(kind)) {
		throw new OperationError(400, `Invalid inventory kind: ${kind}`)
	}

	const query: Record<string, any> = {
		user_id: String(user_id),
	}

	if (kind) query.kind = kind

	const entries = (await InventoryItem.find(query)
		.sort({ granted_at: -1 })
		.lean()) as unknown as InventoryEntry[]

	const idsByKind: Record<string, string[]> = {}

	for (const entry of entries) {
		idsByKind[entry.kind] ??= []
		idsByKind[entry.kind].push(entry.item_id)
	}

	const itemsByKind: Record<string, Map<string, any>> = {}

	for (const [entryKind, ids] of Object.entries(idsByKind)) {
		itemsByKind[entryKind] = await this.getItems(entryKind, ids)
	}

	const items: InventoryListEntry[] = []

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
