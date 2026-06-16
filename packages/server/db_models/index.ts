import mongoose, { Schema, Model } from "mongoose"
import fs from "fs"
import path from "path"

export type ModelDefinition = {
	name: string
	collection: string
	schema: Record<string, any>
	extend?: Record<string, any>
}

export function defineModel(definition: ModelDefinition) {
	const { name, collection, schema, extend } = definition
	const modelSchema = new Schema(schema)

	if (extend) {
		Object.keys(extend).forEach((key) => {
			modelSchema.statics[key] = extend[key]
		})
	}

	return mongoose.model(name, modelSchema, collection)
}

function retreiveModels() {
	let models = {}

	const dirs = fs
		.readdirSync(__dirname)
		.filter((file) => file !== "index.js" && file !== "index.ts")

	dirs.forEach((file) => {
		const mod = require(path.join(__dirname, file)).default

		if (typeof mod === "function" && mod.base) {
			return (models[mod.modelName] = mod)
		}

		return (models[mod.name] = defineModel(mod))
	})

	return models
}

module.exports = retreiveModels()
