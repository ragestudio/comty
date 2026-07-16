import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type ChannelDeletedMessage = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "channel_deleted_messages",
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
		deleted_by_user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		deleted_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
			required: true,
		}),
	},
)

export const model = new Model("channel_deleted_messages", schema)

export default model
