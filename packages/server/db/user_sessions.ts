import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "user_sessions",
		keys: [["user_id"], "session_id"],
	},
	{
		session_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,

		user_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
	},
)

export const model = new Model("user_sessions", schema)

export default model
