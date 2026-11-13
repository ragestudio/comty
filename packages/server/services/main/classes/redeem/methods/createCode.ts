import type { CreateRedeemCodePayload } from "../types"

import RedeemCode from "@db_models/redeemCode"

import { validateRewards } from "../rewards"
import { generateCode } from "../code"
import { sanitizeCode } from "../helpers"

export default async function createCode(
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
