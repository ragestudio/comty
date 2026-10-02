import type { Table } from "./table"

export type IndexSpec = string

export interface StoreSchema {
	[tableName: string]: IndexSpec
}

export interface IndexInfo {
	primaryKey: string
	isAutoIncrement: boolean
	indexes: string[]
}

export function parseSchema(schemaStr: string): IndexInfo {
	const parts = schemaStr.split(",").map((s) => s.trim())
	const primaryPart = parts[0] || "_id"
	const isAutoIncrement = primaryPart.startsWith("++")
	const primaryKey = primaryPart
		.replace("++", "")
		.replace("[", "")
		.replace("]", "")

	return {
		primaryKey,
		isAutoIncrement,
		indexes: parts.slice(1),
	}
}

export type EntityTable<
	T extends Record<string, any>,
	PK extends keyof T,
> = Table<T, T[PK]>
