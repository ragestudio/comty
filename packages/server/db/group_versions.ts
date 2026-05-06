import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "group_versions",
		keys: ["group_id"],
	},
	{
		group_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		__v: {
			type: ColumnTypes.Counter,
		} as Column<number>,
	},
)

export const model = new Model("group_versions", schema)

export default model
