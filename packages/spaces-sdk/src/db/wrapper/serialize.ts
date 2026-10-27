// tinybase cannot store Date values at the top level, so dates are converted
// to iso strings before writing and kept that way when reading
export function serializeRow<T extends Record<string, any>>(row: T): T {
	const result: Record<string, any> = {}

	for (const [key, value] of Object.entries(row)) {
		const serialized = serializeValue(value)

		if (serialized !== undefined) {
			result[key] = serialized
		}
	}

	return result as T
}

function serializeValue(value: unknown): unknown {
	if (value instanceof Date) {
		return value.toISOString()
	}

	if (Array.isArray(value)) {
		return value.map(serializeValue)
	}

	if (value && typeof value === "object") {
		const result: Record<string, unknown> = {}

		for (const [key, child] of Object.entries(value)) {
			const serialized = serializeValue(child)

			if (serialized !== undefined) {
				result[key] = serialized
			}
		}

		return result
	}

	if (
		value === undefined ||
		typeof value === "function" ||
		typeof value === "symbol" ||
		typeof value === "bigint"
	) {
		return undefined
	}

	return value
}
