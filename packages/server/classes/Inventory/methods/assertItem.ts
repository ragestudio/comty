import type Inventory from "../index"
import type { CatalogItem } from "../types"

export default async function (
	this: typeof Inventory,
	kind: string,
	item_id: string,
): Promise<CatalogItem> {
	if (!this.isKind(kind)) {
		throw new OperationError(400, `Invalid inventory kind: ${kind}`)
	}

	const item = await this.getItem(kind, item_id)

	if (!item) {
		throw new OperationError(404, "Inventory item not found")
	}

	return item
}
