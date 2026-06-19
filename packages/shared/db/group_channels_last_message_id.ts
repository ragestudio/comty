import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type GroupChannelsLastMessageId = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "group_channels_last_message_id",
		keys: ["channel_id"],
	},
	{
		channel_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
	},
)

export const model = new Model("group_channels_last_message_id", schema)

export default model
