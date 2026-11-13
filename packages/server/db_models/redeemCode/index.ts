import { defineModel } from "@db_models"

export default defineModel({
	name: "RedeemCode",
	collection: "redeem_codes",
	schema: {
		code_hash: {
			type: String,
			required: true,
			unique: true,
		},
		code_hint: {
			type: String,
			required: true,
		},
		schema_version: {
			type: Number,
			default: 1,
		},
		rewards: {
			type: [
				{
					_id: false,
					type: {
						type: String,
						required: true,
					},
					version: {
						type: Number,
						default: 1,
					},
					data: {
						type: Object,
					},
				},
			],
			required: true,
		},
		max_uses: {
			type: Number,
			default: 1,
		},
		used_count: {
			type: Number,
			default: 0,
		},
		enabled: {
			type: Boolean,
			default: true,
		},
		starts_at: {
			type: Date,
			default: null,
		},
		expires_at: {
			type: Date,
			default: null,
		},
		metadata: {
			type: Object,
		},
		created_by: {
			type: String,
			default: null,
		},
		created_at: {
			type: Date,
			default: Date.now,
		},
	},
})
