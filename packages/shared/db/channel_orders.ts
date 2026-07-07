import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type ChannelOrder = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "group_channels_order",
		keys: ["group_id"],
	},
	{
		group_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		order: defineColumn<Array<string>>()({
			type: "list<text>",
		}),
	},
)

export const model = new Model("group_channels_order", schema)

export default model
