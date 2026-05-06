import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "oidc_store",
		keys: ["id"],
	},
	{
		id: {
			type: ColumnTypes.Text,
			required: true,
		} as Column<string>,
		type: {
			type: ColumnTypes.Text,
		} as Column<string>,
		payload: {
			type: ColumnTypes.Text,
		} as Column<string>,
		grantId: {
			type: ColumnTypes.Text,
		} as Column<string>,
		uid: {
			type: ColumnTypes.Text,
		} as Column<string>,
		consumedAt: {
			type: ColumnTypes.Timestamp,
		} as Column<Date>,
	},
)

export const model = new Model("oidc_store", schema)

export default model
