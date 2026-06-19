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
			type: ColumnTypes.Varchar,
			required: true,
		}),
		role_key: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		permissions: defineColumn<Record<string, boolean>>()({
			type: "<map<varchar, boolean>>",
		}),
	},
)

export const model = new Model("group_roles", schema)

export default model
