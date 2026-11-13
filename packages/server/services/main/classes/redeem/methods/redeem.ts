import RedeemCode from "@db_models/redeemCode"
import RedeemCodeRedemption from "@db_models/redeemCodeRedemption"

import type {
	RedeemPayload,
	RedeemResult,
	RedeemStatus,
	RedemptionRewardResult,
} from "../types"
import { applyReward, validateRewards } from "../rewards"
import { ownsAllRewards, resolveRedeemCode } from "../helpers"

export default async function redeem({
	code,
	user_id,
}: RedeemPayload): Promise<RedeemResult> {
	const { redeemCode, rewards } = await resolveRedeemCode(code)

	const existingRedemption = await RedeemCodeRedemption.findOne({
		code_id: String(redeemCode._id),
		user_id: String(user_id),
	}).lean()

	if (existingRedemption) {
		throw new OperationError(409, "This code has already been redeemed")
	}

	await validateRewards(rewards)

	if (await ownsAllRewards(user_id, rewards)) {
		throw new OperationError(
			409,
			"You already own all the rewards of this code",
		)
	}

	const reserved = await RedeemCode.findOneAndUpdate(
		{
			_id: redeemCode._id,
			enabled: true,
			$or: [
				{ max_uses: 0 },
				{ $expr: { $lt: ["$used_count", "$max_uses"] } },
			],
		},
		{
			$inc: { used_count: 1 },
		},
		{
			new: true,
		},
	)

	if (!reserved) {
		throw new OperationError(400, "This code is no longer available")
	}

	let redemption

	try {
		redemption = await RedeemCodeRedemption.create({
			code_id: String(redeemCode._id),
			user_id: String(user_id),
			status: "pending",
			rewards: [],
		})
	} catch (error: any) {
		await RedeemCode.updateOne(
			{ _id: redeemCode._id },
			{ $inc: { used_count: -1 } },
		)

		if (error.code === 11000) {
			throw new OperationError(409, "This code has already been redeemed")
		}

		throw new OperationError(
			500,
			"The code could not be redeemed, please try again later",
		)
	}

	const results: RedemptionRewardResult[] = []
	let status: RedeemStatus = "completed"

	for (const reward of rewards) {
		try {
			const result = await applyReward({
				user_id,
				code_id: String(redeemCode._id),
				reward,
			})

			results.push({
				type: reward.type,
				version: reward.version ?? 1,
				status: "completed",
				result,
			})
		} catch (error: any) {
			status = results.length > 0 ? "partial" : "failed"

			results.push({
				type: reward.type,
				version: reward.version ?? 1,
				status: "failed",
				error: error.message,
			})
		}
	}

	if (status === "failed") {
		await RedeemCode.updateOne(
			{ _id: redeemCode._id },
			{ $inc: { used_count: -1 } },
		)

		await RedeemCodeRedemption.deleteOne({
			_id: redemption._id,
		})

		throw new OperationError(
			500,
			"The code could not be applied, please try again later",
		)
	}

	await RedeemCodeRedemption.updateOne(
		{ _id: redemption._id },
		{
			status,
			rewards: results,
		},
	)

	return {
		redemption_id: String(redemption._id),
		code_id: String(redeemCode._id),
		status,
		rewards: results,
	}
}
