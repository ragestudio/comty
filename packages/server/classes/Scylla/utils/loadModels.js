import fs from "node:fs"
import path from "node:path"

export default async (fromPath) => {
	if (typeof fromPath !== "string") {
		return {}
	}

	if (!fs.existsSync(fromPath)) {
		console.warn(
			`Cannot load models from [${fromPath}] case this path does not exist`,
		)
		return {}
	}

	let models = {}

	let modelFiles = await fs.promises.readdir(fromPath)

	modelFiles = modelFiles.filter((file) => file.endsWith(".js"))

	for await (const file of modelFiles) {
		const modelName = file.replace(".js", "")
		const modelPath = path.join(fromPath, file)

		try {
			let modelModule = await import(modelPath)

			modelModule = modelModule.default

			models[modelModule.name ?? modelName] = modelModule
		} catch (error) {
			console.error(`Failed to load model [${modelName}]:`, error)
			continue
		}
	}

	return models
}
