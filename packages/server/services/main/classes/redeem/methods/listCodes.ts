import type { ListCodesOptions } from "../types"

import RedeemCode from "@db_models/redeemCode"

export default async function listCodes({
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
