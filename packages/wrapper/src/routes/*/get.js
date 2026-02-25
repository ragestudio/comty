export default async (req, res) => {
	const file = req.file

	const fileParts = file.path.split(".")
	const extension = fileParts[fileParts.length - 1]

	let content = file.content

	if (!content) {
		content = file.stream()
	}

	if (!content) {
		return res.status(500).json({ error: "Cannot read this file" })
	}

	if (content instanceof Buffer) {
		return res.type(extension).send(content)
	} else {
		return res.type(extension).stream(content)
	}
}
