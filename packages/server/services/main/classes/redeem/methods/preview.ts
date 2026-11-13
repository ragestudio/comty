import type { RedeemPayload, RedeemPreviewResult } from "../types"

import RedeemCodeRedemption from "@db_models/redeemCodeRedemption"

import { validateRewards } from "../rewards"
import {
	getInventoryItemsByKind,
	ownsAllRewards,
	resolveRedeemCode,
} from "../helpers"

export default async function preview({
	code,
	user_id,
}: RedeemPayload): Promise<RedeemPreviewResult> {
	const { redeemCode, rewards } = await resolveRedeemCode(code)

	await validateRewards(rewards)

	const existingRedemption = await RedeemCodeRedemption.findOne({
		code_id: String(redeemCode._id),
		user_id: String(user_id),
	}).lean()

	const ownsAll = await ownsAllRewards(user_id, rewards)
	const itemsByKind = await getInventoryItemsByKind(rewards)

	const maxUses = Number(redeemCode.max_uses ?? 1)
	const usedCount = Number(redeemCode.used_count ?? 0)
	const remainingUses =
		maxUses === 0 ? null : Math.max(0, maxUses - usedCount)

	return {
		code_hint: redeemCode.code_hint,
		rewards: rewards.map((reward) => ({
			type: reward.type,
			version: reward.version ?? 1,
			data: reward.data ?? {},
			item:
				reward.type === "inventory_item"
					? (itemsByKind
							.get(reward.data?.kind)
							?.get(String(reward.data?.item_id)) ?? null)
					: null,
		})),
		max_uses: maxUses,
		used_count: usedCount,
		remaining_uses: remainingUses,
		expires_at: redeemCode.expires_at ?? null,
		already_redeemed: Boolean(existingRedemption),
		owns_all: ownsAll,
		available:
			!existingRedemption &&
			!ownsAll &&
			(remainingUses === null || remainingUses > 0),
	}
}
