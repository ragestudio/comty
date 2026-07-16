import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type ExpressionFavorite = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "expressions_favs",
		keys: [["user_id"], "type", "resource_url", "created_at"],
		clustering_order: {
			type: "asc",
			resource_url: "asc",
			created_at: "asc",
		},
	},
	{
		user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		type: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		resource_url: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		metadata: defineColumn<Map<string, string>>()({
			type: "map<varchar, varchar>",
			required: false,
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
			required: true,
		}),
	},
)

export const model = new Model("expressions_favs", schema)

export default model
