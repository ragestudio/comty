import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "channel_messages",
		keys: [["channel_id"], "_id"],
		clustering_order: { _id: "asc" },
	},
	{
		_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		channel_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		user_id: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		message: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		attachments: {
			type: "frozen<list<map<varchar, varchar>>>",
		} as Column<Array<any>>,
		flags: {
			type: "frozen<list<varchar>>",
		} as Column<any>,
		sticker: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		reply_to_id: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		updated_at: {
			type: ColumnTypes.Timestamp,
		} as Column<Date>,
		created_at: {
			type: ColumnTypes.Timestamp,
		} as Column<Date>,
	},
)

export const model = new Model("channel_messages", schema)

export default model
