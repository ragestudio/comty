import type { Store } from "tinybase"

import { cmpKey } from "./keys"

export class Collection<T extends Record<string, any>> {
	private _limit?: number
	private _offset?: number
	private _reverse?: boolean
	private _sortBy?: keyof T

	constructor(
		private store: Store,
		private tableName: string,
		private primaryKey: string,
		private filterFn?: (row: T) => boolean,
		private sortFields?: string[],
	) {}

	limit(count: number): this {
		this._limit = count
		return this
	}

	offset(count: number): this {
		this._offset = count
		return this
	}

	reverse(): this {
		this._reverse = true
		return this
	}

	async sortBy(field: keyof T): Promise<T[]> {
		this._sortBy = field
		return this.toArray()
	}

	async toArray(): Promise<T[]> {
		let items = this.getRows()

		if (this.filterFn) {
			items = items.filter(this.filterFn)
		}

		if (this.sortFields && this.sortFields.length > 0) {
			const fields = this.sortFields
			items.sort((a, b) => {
				for (const field of fields) {
					const result = cmpKey(a[field], b[field])
					if (result !== 0) return result
				}
				return 0
			})
		} else if (this._sortBy) {
			const field = this._sortBy
			items.sort((a, b) => cmpKey(a[field], b[field]))
		}

		if (this._reverse) {
			items.reverse()
		}

		const start = this._offset || 0
		const end = this._limit ? start + this._limit : undefined

		if (start > 0 || end !== undefined) {
			items = items.slice(start, end)
		}

		return items
	}

	async delete(): Promise<number> {
		const items = await this.toArray()

		this.store.transaction(() => {
			items.forEach((item) => {
				this.store.delRow(this.tableName, String(item[this.primaryKey]))
			})
		})

		return items.length
	}

	async first(): Promise<T | undefined> {
		const arr = await this.limit(1).toArray()
		return arr[0]
	}

	async last(): Promise<T | undefined> {
		const arr = await this.reverse().limit(1).toArray()
		return arr[0]
	}

	async count(): Promise<number> {
		const arr = await this.toArray()
		return arr.length
	}

	// materialize rows with their primary key back in place
	private getRows(): T[] {
		const table = this.store.getTable(this.tableName) as Record<string, any>

		return Object.entries(table).map(([rowId, row]) => ({
			[this.primaryKey]: rowId,
			...row,
		})) as T[]
	}
}

export default Collection
