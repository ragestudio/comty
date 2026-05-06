import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "direct_messages_activity",
		keys: [["user_id"], "room_id"],
	},
	{
		user_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		room_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		to_user_id: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		last_message_at: {
			type: ColumnTypes.Timestamp,
		} as Column<Date>,
		direction: {
			type: ColumnTypes.Text,
		} as Column<string>,
		short_message: {
			type: ColumnTypes.Text,
		} as Column<string>,
	},
)

export const model = new Model("direct_messages_activity", schema)

export default model
