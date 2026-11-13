import Decoration from "@db_models/decorations"
import Badge from "@db_models/badge"

import type { CatalogItem, InventoryKind } from "./types"

export const CATALOGS = {
	decoration: Decoration,
	badge: Badge,
}

export const KINDS = Object.keys(CATALOGS) as InventoryKind[]

const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i

export function isKind(kind: string): kind is InventoryKind {
	return KINDS.includes(kind as InventoryKind)
}

export async function getItem(
	kind: string,
	item_id: string | null,
): Promise<CatalogItem | null> {
	const Model = CATALOGS[kind as InventoryKind]

	if (!Model || !item_id) return null

	const id = String(item_id)

	if (!OBJECT_ID_REGEX.test(id)) return null

	return await Model.findOne({
		_id: id,
		enabled: { $ne: false },
	}).lean()
}

export async function getItems(
	kind: string,
	item_ids: Array<string | any>,
): Promise<Map<string, CatalogItem>> {
	const Model = CATALOGS[kind as InventoryKind]

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
