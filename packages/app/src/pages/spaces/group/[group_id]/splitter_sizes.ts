const STORAGE_KEY = "group-splitter-sizes"

export function loadSizes() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) return JSON.parse(raw)
	} catch {}
	return null
}

export function saveSizes(sizes) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes))
	} catch {}
}

export default { loadSizes, saveSizes }
