import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export type Group = {
	__v?: number
	_id: string
	name: string
	description: string
	icon: string
	cover: string
	reachability: string
	owner_user_id: string
	created_at: Date
}

export const schema = new Schema(
	{
		table_name: "groups",
		keys: ["_id"],
	},
	{
		__v: {
			type: ColumnTypes.Int,
		} as Column<number>,
		_id: {
			type: ColumnTypes.Varchar,
			required: true,
		} as Column<string>,
		name: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		description: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		icon: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		cover: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		reachability: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		owner_user_id: {
			type: ColumnTypes.Varchar,
		} as Column<string>,
		created_at: {
			type: ColumnTypes.Timestamp,
		} as Column<Date>,
	},
)

export const model = new Model("groups", schema)

export default model
