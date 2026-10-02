import type { Store } from "tinybase"
import type { IndexInfo } from "./types"

import { Collection } from "./collection"

export class Table<T extends Record<string, any>, TKey = string | number> {
	constructor(
		private store: Store,
		public tableName: string,
		private indexInfo: IndexInfo,
	) {}

	async get(key: TKey): Promise<T | undefined> {
		const row = this.store.getRow(this.tableName, String(key))
		if (!row || Object.keys(row).length === 0) return undefined

		return {
			[this.indexInfo.primaryKey]: key,
			...row,
		} as unknown as T
	}

	async put(item: T, key?: TKey): Promise<TKey> {
		const pkName = this.indexInfo.primaryKey
		let actualKey = key ?? item[pkName]

		if (!actualKey) {
			if (this.indexInfo.isAutoIncrement) {
				actualKey = Date.now() as unknown as TKey
			} else {
				throw new Error(`Primary Key '${pkName}' is missing`)
			}
		}

		const { [pkName]: _, ...dataToSave } = item
		this.store.setRow(this.tableName, String(actualKey), dataToSave)

		return actualKey
	}

	async add(item: T, key?: TKey): Promise<TKey> {
		return this.put(item, key)
	}

	async delete(key: TKey): Promise<void> {
		this.store.delRow(this.tableName, String(key))
	}

	async clear(): Promise<void> {
		this.store.delTable(this.tableName)
	}

	async toArray(): Promise<T[]> {
		return new Collection<T>(this.store, this.tableName).toArray()
	}

	where(field: keyof T) {
		return {
			equals: (value: any): Collection<T> => {
				return new Collection<T>(
					this.store,
					this.tableName,
					(row) => row[field] === value,
				)
			},
		}
	}

	async bulkGet(keys: TKey[]): Promise<(T | undefined)[]> {
		return Promise.all(keys.map((key) => this.get(key)))
	}

	async bulkPut(items: T[], keys?: TKey[]): Promise<TKey[]> {
		const resultKeys: TKey[] = []

		this.store.transaction(() => {
			items.forEach((item, index) => {
				const pkName = this.indexInfo.primaryKey
				const key = keys ? keys[index] : undefined
				let actualKey = key ?? item[pkName]

				if (!actualKey) {
					if (this.indexInfo.isAutoIncrement) {
						actualKey = (Date.now() + index) as unknown as TKey
					} else {
						throw new Error(`Primary Key '${pkName}' is missing`)
					}
				}

				const { [pkName]: _, ...dataToSave } = item
				this.store.setRow(this.tableName, String(actualKey), dataToSave)
				resultKeys.push(actualKey)
			})
		})

		return resultKeys
	}

	async bulkDelete(keys: TKey[]): Promise<void> {
		this.store.transaction(() => {
			keys.forEach((key) => {
				this.store.delRow(this.tableName, String(key))
			})
		})
	}
}

export default Table
