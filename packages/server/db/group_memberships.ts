import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "group_memberships",
		keys: [["user_id"], "group_id", "_id"],
	},
	{
		_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		group_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		user_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		roles: {
			type: "frozen<list<varchar>>",
		} as Column<any>,
		created_at: {
			type: ColumnTypes.Timestamp,
		} as Column<Date>,
	},
)

export const model = new Model("group_memberships", schema)

export default model
