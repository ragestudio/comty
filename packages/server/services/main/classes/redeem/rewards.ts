import Inventory from "@shared-classes/Inventory"

export type RewardData = Record<string, any>

export type Reward = {
	type: string
	version?: number
	data: RewardData
}

type RewardApplyContext<TData = RewardData> = {
	user_id: string
	code_id: string
	version: number
	data: TData
}

type RewardHandler<TData = RewardData> = {
	versions: number[]
	validate(data: TData, version: number): Promise<void> | void
	apply(context: RewardApplyContext<TData>): Promise<Record<string, any>>
}

const handlers: Record<string, RewardHandler> = {
	inventory_item: {
		versions: [1],
		async validate(data) {
			if (!data || typeof data !== "object") {
				throw new OperationError(400, "Invalid inventory reward")
			}

			await Inventory.assertItem(data.kind, data.item_id)
		},
		async apply({ user_id, code_id, data }) {
			const entry = await Inventory.grant({
				user_id,
				kind: data.kind,
				item_id: data.item_id,
				source: "code",
				metadata: {
					code_id,
				},
			})

			return {
				kind: entry.kind,
				item_id: entry.item_id,
			}
		},
	},
}

export function getRewardHandler(type: string): RewardHandler | null {
	return handlers[type] ?? null
}

export function validateReward(reward: Reward): RewardHandler {
	if (!reward || typeof reward.type !== "string") {
		throw new OperationError(400, "Invalid reward")
	}

	const handler = getRewardHandler(reward.type)

	if (!handler) {
		throw new OperationError(400, `Unsupported reward type: ${reward.type}`)
	}

	const version = Number(reward.version ?? 1)

	if (!handler.versions.includes(version)) {
		throw new OperationError(
			400,
			`Unsupported reward version: ${reward.type}@${version}`,
		)
	}

	return handler
}

export async function validateRewards(rewards: Reward[]): Promise<void> {
	if (!Array.isArray(rewards) || rewards.length === 0) {
		throw new OperationError(400, "A code needs at least one reward")
	}

	for (const reward of rewards) {
		const handler = validateReward(reward)

		await handler.validate(reward.data, Number(reward.version ?? 1))
	}
}

export async function applyReward({
	user_id,
	code_id,
	reward,
}: {
	user_id: string
	code_id: string
	reward: Reward
}): Promise<Record<string, any>> {
	const handler = validateReward(reward)

	return await handler.apply({
		user_id,
		code_id,
		version: Number(reward.version ?? 1),
		data: reward.data,
	})
}
