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
			type: ColumnTypes.Varchar,
			required: true,
		}),
		group_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		kind: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		name: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		description: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		explicit: defineColumn<boolean>()({
			type: ColumnTypes.Boolean,
		}),
		params: defineColumn<Record<string, string>>()({
			type: "map<varchar, varchar>",
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
	},
)

export const model = new Model("group_channels", schema)

export default model
