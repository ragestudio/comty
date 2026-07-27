import { Model, Schema, ColumnTypes } from "@ragestudio/scylla-odm"
import { defineColumn, type InferDoc } from "@ragestudio/scylla-odm/types"

export type MultipartUpload = InferDoc<typeof schema>

export const schema = new Schema(
	{
		table_name: "multipart_uploads",
		keys: [["user_id"], "file_hash"],
	},
	{
		user_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		file_hash: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		file_name: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: false,
		}),
		file_size: defineColumn<number>()({
			type: ColumnTypes.Bigint,
			required: false,
		}),
		object_path: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		upload_id: defineColumn<string>()({
			type: ColumnTypes.Varchar,
			required: false,
		}),
		status: defineColumn<"UPLOADING" | "COMPLETED" | "ABORTED">()({
			type: ColumnTypes.Varchar,
			required: true,
		}),
		uploaded_parts: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: false,
		}),
		etag: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: false,
		}),
		metadata: defineColumn<string>()({
			type: ColumnTypes.Text,
			required: false,
		}),
		created_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
			required: true,
		}),
		updated_at: defineColumn<Date>()({
			type: ColumnTypes.Timestamp,
			required: false,
		}),
	},
)

export const model = new Model("multipart_uploads", schema)

export default model
