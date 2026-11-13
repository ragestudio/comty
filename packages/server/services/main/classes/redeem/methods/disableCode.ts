import RedeemCode from "@db_models/redeemCode"

export default async function disableCode(
	code_id: string,
): Promise<Record<string, any>> {
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
