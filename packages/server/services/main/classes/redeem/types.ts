import type { Reward } from "./rewards"

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

export type RedeemPreviewReward = {
	type: string
	version: number
	data: Record<string, any>
	item: Record<string, any> | null
}

export type RedeemPreviewResult = {
	code_hint: string
	rewards: RedeemPreviewReward[]
	max_uses: number
	used_count: number
	remaining_uses: number | null
	expires_at: Date | string | null
	already_redeemed: boolean
	owns_all: boolean
	available: boolean
}

export type PaginationOptions = {
	limit?: number | string
	offset?: number | string
}

export type ListCodesOptions = PaginationOptions & {
	enabled?: boolean | string
}
