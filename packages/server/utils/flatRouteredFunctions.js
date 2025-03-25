// convert routered functions to flat routes,
// eg: { fn:1, nestedfn: { test: 2, test2: 3}} -> { fn:1, nestedfn:test: 2, nestedfn:test2: 3}

export default function flatRouteredFunctions(obj, prefix = "", acc = {}) {
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const value = obj[key]
			// Determine the new key: if there's a prefix, add it with a colon separator.
			const newKey = prefix ? `${prefix}:${key}` : key
			// If value is a non-null object (and not an array), recursively flatten it.
			if (
				value !== null &&
				typeof value === "object" &&
				!Array.isArray(value)
			) {
				flatRouteredFunctions(value, newKey, acc)
			} else {
				acc[newKey] = value
			}
		}
	}
	return acc
}
