import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "group_channels",
		keys: [["group_id"], "_id"],
	},
	{
		__v: {
			type: ColumnTypes.Bigint,
		} as Column<bigint>,
		_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		group_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		kind: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		name: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		description: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		explicit: {
			type: ColumnTypes.Boolean,
		} as Column<boolean>,
		params: {
			type: "map<varchar, varchar>",
		} as Column<any>,
		created_at: {
			type: ColumnTypes.Timestamp,
		} as Column<Date>,
	},
)

export const model = new Model("group_channels", schema)

export default model
