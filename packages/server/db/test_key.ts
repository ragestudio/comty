import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "test_data_table",
		keys: ["key"],
	},
	{
		key: {
			type: ColumnTypes.Text,
			required: true,
		} as Column<string>,
		value: {
			type: ColumnTypes.Text,
		} as Column<string>,
	},
)

export const model = new Model("test", schema)

export default model
