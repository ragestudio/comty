import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type ExpressionFavorite = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "expressions_favs",
		keys: [["user_id"], "type", "_id"],
		clustering_order: {
			type: "desc",
			_id: "desc",
		},
	},
	{
		_id: defineColumn<number>()({
			type: ColumnTypes.Bigint,
			required: true,
		}),
		user_id: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: true,
		}),
		type: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: true,
		}),
		resource_url: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: true,
		}),
		metadata: defineColumn<Map<string, string>>()({
			type: "map<Text, Text>",
			required: false,
		}),
	},
)

export const model = new Model("expressions_favs", schema)

export default model
