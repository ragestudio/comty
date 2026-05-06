import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "direct_messages_rooms",
		keys: [["pair_key"], "_id"],
	},
	{
		_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		pair_key: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		name: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		created_at: {
			type: ColumnTypes.Timestamp,
		} as Column<Date>,
	},
)

export const model = new Model("direct_messages_rooms", schema)

export default model
