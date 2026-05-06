import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "groups_user_orders",
		keys: ["user_id"],
	},
	{
		user_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		order: {
			type: "list<text>",
		} as Column<any>,
	},
)

export const model = new Model("groups_user_orders", schema)

export default model
