import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "group_memberships_counter",
		keys: ["group_id"],
	},
	{
		group_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		counter: {
			type: ColumnTypes.Counter,
		} as Column<number>,
	},
)

export const model = new Model("group_memberships_counter", schema)

export default model
