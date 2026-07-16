import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type DirectMessagesActivity = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "direct_messages_activity",
		keys: [["user_id"], "room_id"],
	},
	{
		user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		room_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		to_user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		last_message_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
		direction: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		short_message: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
	},
)

export const model = new Model("direct_messages_activity", schema)

export default model
