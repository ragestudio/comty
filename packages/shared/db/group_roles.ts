import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type GroupRole = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "group_roles",
		keys: [["group_id"], "role_key"],
	},
	{
		group_id: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: true,
		}),
		role_key: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: true,
		}),
		label: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		color: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		position: defineColumn<number>()({
			type: ColumnTypes.Int,
		}),
		is_default: defineColumn<boolean>()({
			type: ColumnTypes.Boolean,
		}),
		permissions: defineColumn<Record<string, boolean>>()({
			type: "map<Text, boolean>",
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
	},
)

export const model = new Model("group_roles", schema)

export default model
