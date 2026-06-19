import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type DirectMessagesRoom = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "direct_messages_rooms",
		keys: [["pair_key"], "_id"],
	},
	{
		_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		pair_key: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		name: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
	},
)

export const model = new Model("direct_messages_rooms", schema)

export default model
