import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type GroupVersion = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "group_versions",
		keys: ["group_id"],
	},
	{
		group_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		__v: defineColumn<number>()({
			type: ColumnTypes.Counter,
		}),
	},
)

export const model = new Model("group_versions", schema)

export default model
