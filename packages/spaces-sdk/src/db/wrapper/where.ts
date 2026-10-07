import type { Store } from "tinybase"

import { Collection } from "./collection"
import { cmpKey, parseIndexFields, pickIndexValue } from "./keys"

// emulates dexie's WhereClause, every matcher returns a Collection
export class WhereClause<T extends Record<string, any>> {
	private fields: string[]

	constructor(
		private store: Store,
		private tableName: string,
		private primaryKey: string,
		index: string,
	) {
		this.fields = parseIndexFields(index)
	}

	equals(value: any): Collection<T> {
		return this.build((rowValue) => cmpKey(rowValue, value) === 0)
	}

	anyOf(values: any[]): Collection<T> {
		return this.build((rowValue) =>
			values.some((value) => cmpKey(rowValue, value) === 0),
		)
	}

	between(
		lower: any,
		upper: any,
		includeLower = true,
		includeUpper = false,
	): Collection<T> {
		return this.build((rowValue) => {
			const lowerResult = cmpKey(rowValue, lower)
			const upperResult = cmpKey(rowValue, upper)

			return (
				(includeLower ? lowerResult >= 0 : lowerResult > 0) &&
				(includeUpper ? upperResult <= 0 : upperResult < 0)
			)
		})
	}

	private build(filter: (rowValue: any) => boolean): Collection<T> {
		const fields = this.fields

		return new Collection<T>(
			this.store,
			this.tableName,
			this.primaryKey,
			(row) => filter(pickIndexValue(row, fields)),
			fields,
		)
	}
}

export default WhereClause
