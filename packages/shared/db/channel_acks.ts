import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type ChannelAckDoc = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "channel_acks",
		keys: [["user_id"], "reference_id"],
	},
	{
		user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		reference_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		last_read_message_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		updated_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
			required: true,
		}),
	},
)

export const model = new Model("channel_acks", schema)

export default model
