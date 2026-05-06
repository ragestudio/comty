import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "group_memberships_ref",
		keys: [["group_id"], "created_at"],
	},
	{
		group_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		user_id: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		membership_id: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		created_at: {
			type: ColumnTypes.Timestamp,
			required: true,
		} as Column<Date>,
	},
)

export const model = new Model("group_memberships_ref", schema)

export default model
