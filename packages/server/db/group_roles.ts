import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "group_roles",
		keys: [["group_id"], "role_key"],
	},
	{
		group_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		role_key: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		permissions: {
			type: "frozen<list<map<varchar, boolean>>>",
		} as Column<any>,
	},
)

export const model = new Model("group_roles", schema)

export default model
