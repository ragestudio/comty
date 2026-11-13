import { defineModel } from "@db_models"

export default defineModel({
	name: "RedeemCodeRedemption",
	collection: "redeem_code_redemptions",
	schema: {
		code_id: {
			type: String,
			required: true,
			index: true,
		},
		user_id: {
			type: String,
			required: true,
			index: true,
		},
		status: {
			type: String,
			default: "pending",
			enum: ["pending", "completed", "partial", "failed"],
		},
		rewards: {
			type: [
				{
					_id: false,
					type: { type: String },
					version: { type: Number },
					status: { type: String },
					result: { type: Object },
					error: { type: String },
				},
			],
		},
		redeemed_at: {
			type: Date,
			default: Date.now,
		},
	},
	indexes: [
		{
			fields: { code_id: 1, user_id: 1 },
			options: { unique: true },
		},
	],
})
