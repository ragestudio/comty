import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import type { Column } from "@ragestudio/scylla-odm/types"

export const schema = new Schema(
	{
		table_name: "oidc_apps",
		keys: ["client_id"],
	},
	{
		client_id: {
			type: ColumnTypes.Text,
			required: true,
		} as Column<string>,
		client_secret: {
			type: ColumnTypes.Text,
		} as Column<string>,
		owner_id: {
			type: ColumnTypes.Uuid,
		} as Column<string>,
		client_name: {
			type: ColumnTypes.Text,
		} as Column<string>,
		redirect_uris: {
			type: "list<text>",
		} as Column<any>,
		grant_types: {
			type: "list<text>",
		} as Column<any>,
		response_types: {
			type: "list<text>",
		} as Column<any>,
	},
)

export const model = new Model("oidc_apps", schema)

export default model
