import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "group_channels_last_message_id",
		keys: ["channel_id"],
	},
	{
		channel_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		_id: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
	},
)

export const model = new Model("group_channels_last_message_id", schema)

export default model
