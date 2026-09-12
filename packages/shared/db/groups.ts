import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn } from "@ragestudio/scylla-odm/types"
import type { InferDoc } from "@ragestudio/scylla-odm/types"

export type Group = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "groups",
		keys: ["_id"],
	},
	{
		__v: defineColumn<number>()({
			type: ColumnTypes.Int,
		}),
		_id: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: true,
		}),
		name: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		description: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		icon: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		cover: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		reachability: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		owner_user_id: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
	},
)

export const model = new Model("groups", schema)

export default model
