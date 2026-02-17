export default function removeCircularReferences(obj, visited = new WeakSet()) {
	if (obj === null || typeof obj !== "object") {
		return obj
	}

	if (visited.has(obj)) {
		return "[Circular Reference]"
	}

	visited.add(obj)

	if (Array.isArray(obj)) {
		const result = obj.map((item) =>
			removeCircularReferences(item, visited),
		)
		visited.delete(obj)
		return result
	}

	const result = {}
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			result[key] = removeCircularReferences(obj[key], visited)
		}
	}

	visited.delete(obj)
	return result
}
