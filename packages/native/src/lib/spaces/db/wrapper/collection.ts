import type { Store } from "tinybase"

export class Collection<T extends Record<string, any>> {
	private _limit?: number
	private _offset?: number
	private _reverse?: boolean
	private _sortBy?: keyof T

	constructor(
		private store: Store,
		private tableName: string,
		private filterFn?: (row: T) => boolean,
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
		const tableObj = this.store.getTable(this.tableName) as Record<
			string,
			T
		>

		let items = Object.values(tableObj)

		if (this.filterFn) {
			items = items.filter(this.filterFn)
		}

		if (this._sortBy) {
			items.sort((a, b) => {
				const valA = a[this._sortBy as keyof T]
				const valB = b[this._sortBy as keyof T]
				if (valA < valB) return -1
				if (valA > valB) return 1
				return 0
			})
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
}

export default Collection
