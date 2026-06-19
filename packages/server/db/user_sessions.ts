import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type UserSession = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "user_sessions",
		keys: [["user_id"], "session_id"],
	},
	{
		session_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),

		user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
	},
)

export const model = new Model("user_sessions", schema)

export default model
