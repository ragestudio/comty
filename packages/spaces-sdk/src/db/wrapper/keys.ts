// key comparison helpers that emulate dexie index semantics

// split an index expression into its fields
// supports single keys ("group_id") and compound keys ("[channel_id+_id]")
export function parseIndexFields(index: string): string[] {
	const trimmed = index.trim()

	if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
		return trimmed
			.slice(1, -1)
			.split("+")
			.map((field) => field.trim())
			.filter(Boolean)
	}

	return [trimmed]
}

// extract the value used by an index for a given row
export function pickIndexValue(
	row: Record<string, any>,
	fields: string[],
): any {
	if (fields.length === 1) return row[fields[0]]

	return fields.map((field) => row[field])
}

// compare two index values, including compound arrays and dexie bounds
export function cmpKey(a: any, b: any): number {
	if (a === b) return 0

	const aMin = isMinKey(a)
	const bMin = isMinKey(b)
	if (aMin || bMin) return aMin && bMin ? 0 : aMin ? -1 : 1

	const aMax = isMaxKey(a)
	const bMax = isMaxKey(b)
	if (aMax || bMax) return aMax && bMax ? 0 : aMax ? 1 : -1

	if (Array.isArray(a) && Array.isArray(b)) {
		const length = Math.min(a.length, b.length)

		for (let i = 0; i < length; i++) {
			const result = cmpKey(a[i], b[i])
			if (result !== 0) return result
		}

		return a.length - b.length
	}

	return a < b ? -1 : a > b ? 1 : 0
}

// dexie.minKey is -Infinity
function isMinKey(value: any): boolean {
	return value === Number.NEGATIVE_INFINITY
}

// dexie.maxKey is [[]] when IndexedDB is available
function isMaxKey(value: any): boolean {
	return (
		value === Number.POSITIVE_INFINITY ||
		(Array.isArray(value) &&
			value.length === 1 &&
			Array.isArray(value[0]) &&
			value[0].length === 0)
	)
}
