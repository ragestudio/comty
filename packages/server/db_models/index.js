import mongoose, { Schema } from "mongoose"
import fs from "fs"
import path from "path"

function generateModels() {
	let models = {}

	const dirs = fs.readdirSync(__dirname).filter((file) => file !== "index.js")

	dirs.forEach((file) => {
		const model = require(path.join(__dirname, file)).default

		if (mongoose.models[model.name]) {
			return (models[model.name] = mongoose.model(model.name))
		}

		model.schema = new Schema(model.schema)

		if (model.extend) {
			Object.keys(model.extend).forEach((key) => {
				model.schema.statics[key] = model.extend[key]
			})
		}

		return (models[model.name] = mongoose.model(
			model.name,
			model.schema,
			model.collection,
		))
	})

	return models
}

module.exports = generateModels()
