import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn } from "@ragestudio/scylla-odm/types"
import type { InferDoc } from "@ragestudio/scylla-odm/types"

export type Group = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "groups",
		keys: ["_id"],
	},
	{
		__v: defineColumn<number>()({
			type: ColumnTypes.Int,
		}),
		_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		name: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		description: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		icon: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		cover: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		reachability: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		owner_user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
		}),
	},
)

export const model = new Model("groups", schema)

export default model
