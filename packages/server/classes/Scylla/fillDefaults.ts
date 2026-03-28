export default function (this: any, data: any) {
	if (!this.description.options?.defaults) {
		return data
	}

	let nw = { ...data }

	for (let [key, value] of Object.entries(data)) {
		const defaultValue = this.description.options.defaults[key]

		if (
			typeof defaultValue !== "undefined" &&
			(value == null || value == undefined)
		) {
			nw[key] = defaultValue
		}
	}

	return nw
}
