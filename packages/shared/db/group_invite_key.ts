import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type GroupInviteKey = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "groups_invite_keys",
		keys: [["group_id"], "key"],
	},
	{
		group_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		key: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		issuer_user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
		expires_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
		max_usage: defineColumn<number>()({
			type: ColumnTypes.Int,
		}),
		usages: defineColumn<number>()({
			type: ColumnTypes.Int,
		}),
	},
)

export const model = new Model("group_invite_key", schema)

export default model
