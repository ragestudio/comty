import mongoose, { Schema } from "mongoose"

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
