import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "groups_invite_keys",
		keys: [["group_id"], "key"],
	},
	{
		group_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		key: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		issuer_user_id: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		created_at: {
			type: ColumnTypes.Timestamp,
		} as Column<Date>,
		expires_at: {
			type: ColumnTypes.Timestamp,
		} as Column<Date>,
		max_usage: {
			type: ColumnTypes.Int,
		} as Column<number>,
		usages: {
			type: ColumnTypes.Int,
		} as Column<number>,
	},
)

export const model = new Model("group_invite_key", schema)

export default model
