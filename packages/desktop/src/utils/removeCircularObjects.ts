export default function removeCircularReferences(
	value: unknown,
	visited = new WeakSet<object>(),
): unknown {
	if (value === null || typeof value !== "object") {
		return value
	}

	if (visited.has(value)) {
		return "[Circular Reference]"
	}

	visited.add(value)

	if (Array.isArray(value)) {
		const result = value.map((item) => removeCircularReferences(item, visited))
		visited.delete(value)
		return result
	}

	const result: Record<string, unknown> = {}

	for (const [key, item] of Object.entries(value)) {
		result[key] = removeCircularReferences(item, visited)
	}

	visited.delete(value)
	return result
}
