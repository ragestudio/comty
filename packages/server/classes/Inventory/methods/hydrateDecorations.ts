import type Inventory from "../index"
import type { CatalogItem } from "../types"

export default async function (
	this: typeof Inventory,
	decorations: Record<string, string> | null,
): Promise<Record<string, CatalogItem>> {
	if (!decorations) return {}

	const items = await this.getItems("decoration", Object.values(decorations))

	const hydrated: Record<string, CatalogItem> = {}

	for (const [slot, id] of Object.entries(decorations)) {
		const item = items.get(String(id))

		if (item) {
			hydrated[slot] = item
		}
	}

	return hydrated
}
