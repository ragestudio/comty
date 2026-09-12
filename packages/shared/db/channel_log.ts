import { ColumnTypes, Model, Schema } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type ChannelLog = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "channel_log",
		keys: [["channel_id"], "timestamp", "log_id"],
		clustering_order: {
			timestamp: "desc",
		},
	},
	{
		channel_id: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		log_id: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		type: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		target_id: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		actor_id: defineColumn<string>()({
			type: ColumnTypes.Text,
		}),
		timestamp: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
	},
)

export const model = new Model("channel_log", schema)

export default model
