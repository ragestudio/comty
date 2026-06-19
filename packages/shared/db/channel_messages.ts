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
			type: ColumnTypes.Varchar,
			required: true,
		}),
		channel_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		message: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		attachments: defineColumn<Array<Record<string, string>>>()({
			type: "frozen<list<map<varchar, varchar>>>",
		}),
		flags: defineColumn<Array<string>>()({
			type: "frozen<list<varchar>>",
		}),
		sticker: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		reply_to_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		nonce: defineColumn<string>()({
			type: ColumnTypes.Varchar,
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
