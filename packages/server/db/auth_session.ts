import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type AuthSession = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "auth_sessions",
		keys: [["_id"], "user_id"],
	},
	{
		_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		token: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		username: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		sign_location: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		ip_address: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		client: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
	},
)

export const model = new Model("auth_sessions", schema)

export default model
