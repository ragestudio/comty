import { ColumnTypes, Model, Schema } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "channel_log",
		keys: [["channel_id"], "timestamp", "log_id"],
		clustering_order: {
			timestamp: "desc",
		},
	},
	{
		channel_id: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		log_id: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		type: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		target_id: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		actor_id: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		timestamp: {
			type: ColumnTypes.Timestamp,
		} as Column<Date>,
	},
)

export const model = new Model("channel_log", schema)

export default model
