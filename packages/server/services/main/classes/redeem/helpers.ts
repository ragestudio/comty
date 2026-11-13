import RedeemCode from "@db_models/redeemCode"
import Inventory from "@shared-classes/Inventory"

import { hashCode } from "./code"
import type { Reward } from "./rewards"

export function sanitizeCode(code: Record<string, any>): Record<string, any> {
	const { code_hash, __v, ...safe } = code ?? {}

	return safe
}

export async function resolveRedeemCode(code: string) {
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

	return {
		redeemCode,
		rewards: redeemCode.rewards as Reward[],
	}
}

export function getInventoryRewards(rewards: Reward[]): Reward[] {
	return rewards.filter((reward) => reward.type === "inventory_item")
}

export async function ownsAllRewards(
	user_id: string,
	rewards: Reward[],
): Promise<boolean> {
	const inventoryRewards = getInventoryRewards(rewards)

	if (
		inventoryRewards.length === 0 ||
		inventoryRewards.length !== rewards.length
	) {
		return false
	}

	for (const reward of inventoryRewards) {
		const owned = await Inventory.owns(user_id, reward.data.kind, [
			reward.data.item_id,
		])

		if (owned.length === 0) return false
	}

	return true
}

export async function getInventoryItemsByKind(
	rewards: Reward[],
): Promise<Map<string, Map<string, any>>> {
	const inventoryRewards = getInventoryRewards(rewards)
	const itemsByKind = new Map<string, Map<string, any>>()

	for (const reward of inventoryRewards) {
		const kind = reward.data?.kind

		if (!kind || itemsByKind.has(kind)) continue

		const ids = inventoryRewards
			.filter((entry) => entry.data?.kind === kind)
			.map((entry) => entry.data.item_id)

		itemsByKind.set(kind, await Inventory.getItems(kind, ids))
	}

	return itemsByKind
}
