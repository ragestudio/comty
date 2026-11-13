export type InventoryKind = "decoration" | "badge"

export type CatalogItem = Record<string, any>

export type InventoryEntry = {
	user_id: string
	kind: InventoryKind
	item_id: string
	source: string
	granted_by: string | null
	granted_at: Date
	metadata: Record<string, any>
}

export type InventoryEntryWithItem = InventoryEntry & {
	item: CatalogItem
}

export type InventoryListEntry = InventoryEntry & {
	item: CatalogItem | null
	unavailable: boolean
}

export type GrantInventoryItemParams = {
	user_id: string
	kind: string
	item_id: string
	source?: string
	granted_by?: string | null
	metadata?: Record<string, any>
}

export type RevokeInventoryItemParams = {
	user_id: string
	kind: string
	item_id: string
}

export type ListInventoryOptions = {
	kind?: string
	includeOrphaned?: boolean
}
