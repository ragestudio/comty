import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type GroupMembershipsRef = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "group_memberships_ref",
		keys: [["group_id"], "membership_id", "created_at"],
	},
	{
		group_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		membership_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
			required: true,
		}),
	},
)

export const model = new Model("group_memberships_ref", schema)

export default model
