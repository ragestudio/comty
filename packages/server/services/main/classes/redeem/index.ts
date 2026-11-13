import RedeemCode from "@db_models/redeemCode"
import RedeemCodeRedemption from "@db_models/redeemCodeRedemption"

import Inventory from "@shared-classes/Inventory"

import { applyReward, validateRewards, type Reward } from "./rewards"
import { generateCode, hashCode } from "./code"

export type CreateRedeemCodePayload = {
	rewards: Reward[]
	max_uses?: number | null
	starts_at?: Date | string | null
	expires_at?: Date | string | null
	metadata?: Record<string, any>
	created_by?: string | null
}

export type RedeemPayload = {
	code: string
	user_id: string
}

export type RedeemStatus = "completed" | "partial" | "failed"

export type RedemptionRewardResult = {
	type: string
	version: number
	status: "completed" | "failed"
	result?: Record<string, any>
	error?: string
}

export type RedeemResult = {
	redemption_id: string
	code_id: string
	status: RedeemStatus
	rewards: RedemptionRewardResult[]
}

export type PaginationOptions = {
	limit?: number | string
	offset?: number | string
}

export type ListCodesOptions = PaginationOptions & {
	enabled?: boolean | string
}

function sanitizeCode(code: Record<string, any>): Record<string, any> {
	const { code_hash, __v, ...safe } = code ?? {}

	return safe
}

export default class Redeem {
	static async createCode(
		payload: CreateRedeemCodePayload,
	): Promise<Record<string, any>> {
		const {
			rewards,
			max_uses,
			starts_at = null,
			expires_at = null,
			metadata = {},
			created_by = null,
		} = payload ?? ({} as CreateRedeemCodePayload)

		await validateRewards(rewards)

		const maxUses =
			max_uses === undefined || max_uses === null ? 1 : Number(max_uses)

		if (!Number.isInteger(maxUses) || maxUses < 0) {
			throw new OperationError(
				400,
				"max_uses must be a positive integer or 0 for unlimited",
			)
		}

		const generated = generateCode()

		const code = await RedeemCode.create({
			code_hash: generated.hash,
			code_hint: generated.hint,
			schema_version: 1,
			rewards,
			max_uses: maxUses,
			used_count: 0,
			enabled: true,
			starts_at,
			expires_at,
			metadata,
			created_by,
		})

		return {
			code: generated.code,
			...sanitizeCode(code.toObject()),
		}
	}

	static async redeem({
		code,
		user_id,
	}: RedeemPayload): Promise<RedeemResult> {
		const codeHash = hashCode(code)

		const redeemCode = await RedeemCode.findOne({
			code_hash: codeHash,
			enabled: true,
		}).lean()

		if (!redeemCode) {
			throw new OperationError(400, "Invalid or expired code")
		}

		const now = new Date()

		if (redeemCode.starts_at && new Date(redeemCode.starts_at) > now) {
			throw new OperationError(400, "Invalid or expired code")
		}

		if (redeemCode.expires_at && new Date(redeemCode.expires_at) < now) {
			throw new OperationError(400, "Invalid or expired code")
		}

		const existingRedemption = await RedeemCodeRedemption.findOne({
			code_id: String(redeemCode._id),
			user_id: String(user_id),
		}).lean()

		if (existingRedemption) {
			throw new OperationError(409, "This code has already been redeemed")
		}

		const rewards = redeemCode.rewards as Reward[]

		await validateRewards(rewards)

		const inventoryRewards = rewards.filter(
			(reward) => reward.type === "inventory_item",
		)

		if (
			inventoryRewards.length > 0 &&
			inventoryRewards.length === rewards.length
		) {
			let ownsAll = true

			for (const reward of inventoryRewards) {
				const owned = await Inventory.owns(user_id, reward.data.kind, [
					reward.data.item_id,
				])

				if (owned.length === 0) {
					ownsAll = false
					break
				}
			}

			if (ownsAll) {
				throw new OperationError(
					409,
					"You already own all the rewards of this code",
				)
			}
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
				throw new OperationError(
					409,
					"This code has already been redeemed",
				)
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

	static async listCodes({
		limit = 50,
		offset = 0,
		enabled,
	}: ListCodesOptions = {}): Promise<Record<string, any>[]> {
		const query: Record<string, any> = {}

		if (typeof enabled !== "undefined") {
			query.enabled = ToBoolean(enabled)
		}

		return await RedeemCode.find(query)
			.select("-code_hash")
			.sort({ created_at: -1 })
			.limit(Number(limit))
			.skip(Number(offset))
			.lean()
	}

	static async getCode(code_id: string): Promise<Record<string, any>> {
		const code = await RedeemCode.findById(code_id)
			.select("-code_hash")
			.lean()
			.catch(() => null)

		if (!code) {
			throw new OperationError(404, "Code not found")
		}

		return code
	}

	static async disableCode(code_id: string): Promise<Record<string, any>> {
		const code = await RedeemCode.findByIdAndUpdate(
			code_id,
			{ enabled: false },
			{ new: true },
		)
			.select("-code_hash")
			.lean()
			.catch(() => null)

		if (!code) {
			throw new OperationError(404, "Code not found")
		}

		return code
	}

	static async getRedemptions(
		code_id: string,
		{ limit = 50, offset = 0 }: PaginationOptions = {},
	): Promise<Record<string, any>[]> {
		return await RedeemCodeRedemption.find({
			code_id: String(code_id),
		})
			.sort({ redeemed_at: -1 })
			.limit(Number(limit))
			.skip(Number(offset))
			.lean()
	}
}
