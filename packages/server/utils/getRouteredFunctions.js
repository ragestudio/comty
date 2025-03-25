import fs from "node:fs/promises"
import path from "node:path"

export default async function getRouteredFunctions(dir) {
	const files = await fs.readdir(dir)

	const result = {}

	for (const file of files) {
		const filePath = path.join(dir, file)
		const stat = await fs.stat(filePath)

		const eventName = path.basename(file).split(".")[0]

		if (stat.isFile()) {
			const event = await import(filePath)
			result[eventName] = event.default
		} else if (stat.isDirectory()) {
			result[eventName] = await getRouteredFunctions(filePath)
		}
	}

	return result
}
