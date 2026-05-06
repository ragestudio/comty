import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "group_channels_order",
		keys: ["group_id"],
	},
	{
		group_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		order: {
			type: "list<text>",
		} as Column<any>,
	},
)

export const model = new Model("channel_orders", schema)

export default model
