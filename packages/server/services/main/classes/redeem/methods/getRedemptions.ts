import type { PaginationOptions } from "../types"

import RedeemCodeRedemption from "@db_models/redeemCodeRedemption"

export default async function getRedemptions(
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
