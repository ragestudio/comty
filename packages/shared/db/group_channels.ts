import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type GroupChannel = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "group_channels",
		keys: [["group_id"], "_id"],
	},
	{
		__v: defineColumn<bigint>()({
			type: ColumnTypes.Bigint,
		}),
		_id: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: true,
		}),
		group_id: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: true,
		}),
		kind: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		name: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		description: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		explicit: defineColumn<boolean>()({
			type: ColumnTypes.Boolean,
		}),
		params: defineColumn<Record<string, string>>()({
			type: "map<Text, Text>",
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
	},
)

export const model = new Model("group_channels", schema)

export default model
