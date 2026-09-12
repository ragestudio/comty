import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type ChannelMessage = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "channel_messages",
		keys: [["channel_id"], "_id"],
		clustering_order: { _id: "asc" },
	},
	{
		_id: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: true,
		}),
		channel_id: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: true,
		}),
		user_id: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		message: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		attachments: defineColumn<Array<Record<string, string>>>()({
			type: "frozen<list<map<Text, Text>>>",
		}),
		flags: defineColumn<Array<string>>()({
			type: "frozen<list<Text>>",
		}),
		sticker: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		reply_to_id: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		nonce: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		updated_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
	},
)

export const model = new Model("channel_messages", schema)

export default model
