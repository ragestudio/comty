import fs from "node:fs"
import path from "node:path"

export default async function readCommandsFiles(from) {
	const result = []
	let files = await fs.promises.readdir(from)

	for (const file of files) {
		const filePath = path.join(from, file)
		const stat = await fs.promises.stat(filePath)

		if (stat.isDirectory()) {
			result.push(path.resolve(from, file, "index.js"))
		}
	}

	return result
}
