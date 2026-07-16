import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type GroupsUserOrder = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "groups_user_orders",
		keys: ["user_id"],
	},
	{
		user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		order: defineColumn<Array<string>>()({
			type: "list<text>",
		}),
	},
)

export const model = new Model("groups_user_orders", schema)

export default model
