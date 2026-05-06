import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "auth_sessions",
		keys: [["_id"], "user_id"],
	},
	{
		_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		token: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		user_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		username: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		sign_location: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		ip_address: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		client: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		created_at: {
			type: ColumnTypes.Timestamp,
		} as Column<Date>,
	},
)

export const model = new Model("auth_sessions", schema)

export default model
