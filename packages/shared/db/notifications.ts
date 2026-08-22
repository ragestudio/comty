import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type NotificationDoc = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "notifications",
		keys: [["user_id"], "_id"],
		clustering_order: { _id: "desc" },
	},
	{
		_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		type: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		reference_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		sender_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		data: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
			required: true,
		}),
	},
)

export const model = new Model("notifications", schema)

export default model
