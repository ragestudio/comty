import type { Store } from "tinybase"
import type { StoreSchema } from "./types"

import { createStore } from "tinybase"
import { parseSchema } from "./types"
import { Table } from "./table"

export class DexieCompat {
	public store: Store
	private tables: Map<string, Table<any, any>> = new Map()

	constructor(public dbName: string) {
		this.store = createStore()
	}

	version(_versionNumber: number) {
		return {
			stores: (schema: StoreSchema) => {
				Object.entries(schema).forEach(([tableName, schemaStr]) => {
					const indexInfo = parseSchema(schemaStr)
					const tableInstance = new Table(
						this.store,
						tableName,
						indexInfo,
					)

					this.tables.set(tableName, tableInstance)

					Object.defineProperty(this, tableName, {
						value: tableInstance,
						writable: false,
						configurable: true,
					})
				})
				return this
			},
		}
	}

	table<T extends Record<string, any>, TKey = string | number>(
		tableName: string,
	): Table<T, TKey> {
		const table = this.tables.get(tableName)

		if (!table) {
			throw new Error(`Table [${tableName}] does not exist`)
		}

		return table as Table<T, TKey>
	}
}

export default DexieCompat
