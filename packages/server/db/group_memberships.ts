import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type GroupMembership = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "group_memberships",
		keys: [["user_id"], "group_id", "_id"],
	},
	{
		_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		group_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		roles: defineColumn<Array<string>>()({
			type: "frozen<list<varchar>>",
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
	},
)

export const model = new Model("group_memberships", schema)

export default model
