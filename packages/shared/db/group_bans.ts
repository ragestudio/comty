import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type GroupBan = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "group_bans",
		keys: [["group_id"], "user_id"],
	},
	{
		group_id: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: true,
		}),
		user_id: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: true,
		}),
		banned_by: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		reason: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
	},
)

export const model = new Model("group_bans", schema)

export default model
