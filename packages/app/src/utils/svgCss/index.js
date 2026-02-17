export default (str, { color } = {}) => {
	if (typeof color === "string") {
		str = str
			.replace(/fill="[^"]*"/g, `fill="${color}"`)
			.replace(/stroke="[^"]*"/g, `stroke="${color}"`)
	}

	str = str
		.replace(/#/g, "%23")
		.replace(/\?/g, "%3F")
		.replace(/[\t\n\r]/gm, "")
		.replace(/\s\s+/g, " ")
		.replace(/'/g, '"')
		.replace(/> </g, "><")

	return "url('data:image/svg+xml," + str + "')"
}
