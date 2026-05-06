import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "channel_deleted_messages",
		keys: [["channel_id"], "_id"],
		clustering_order: { _id: "asc" },
	},
	{
		_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<String>,
		channel_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<String>,
		deleted_by_user_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<String>,
		deleted_at: {
			type: ColumnTypes.Timestamp,
			required: true,
		} as Column<Date>,
	},
)

export const model = new Model("channel_deleted_messages", schema)

export default model
