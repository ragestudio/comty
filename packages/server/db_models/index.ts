import mongoose, { Schema } from "mongoose"

export type ModelDefinition = {
	name: string
	collection: string
	schema: Record<string, any>
	extend?: Record<string, any>
	indexes?: Array<{
		fields: Record<string, 1 | -1>
		options?: Record<string, any>
	}>
}

export function defineModel(definition: ModelDefinition) {
	const { name, collection, schema, extend, indexes } = definition
	const modelSchema = new Schema(schema)

	if (indexes) {
		for (const index of indexes) {
			modelSchema.index(index.fields, index.options ?? {})
		}
	}

	if (extend) {
		Object.keys(extend).forEach((key) => {
			modelSchema.statics[key] = extend[key]
		})
	}

	return mongoose.model(name, modelSchema, collection)
}
