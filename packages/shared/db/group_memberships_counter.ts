import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type GroupMembershipsCounter = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "group_memberships_counter",
		keys: ["group_id"],
	},
	{
		group_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		counter: defineColumn<number>()({
			type: ColumnTypes.Counter,
		}),
	},
)

export const model = new Model("group_memberships_counter", schema)

export default model
