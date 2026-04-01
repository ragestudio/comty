export default function (this: any, data: any) {
	const defaults = this.description.options?.defaults

	if (!defaults || Object.keys(defaults).length === 0) {
		return data
	}

	let needsDefaults = false

	for (const key in defaults) {
		if (data[key] == null) {
			needsDefaults = true
			break
		}
	}

	if (!needsDefaults) {
		return data
	}

	const result = Object.assign({}, data)

	for (const key in defaults) {
		if (result[key] == null) {
			result[key] = defaults[key]
		}
	}

	return result
}
