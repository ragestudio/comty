import RedeemCode from "@db_models/redeemCode"

export default async function getCode(
	code_id: string,
): Promise<Record<string, any>> {
	const code = await RedeemCode.findById(code_id)
		.select("-code_hash")
		.lean()
		.catch(() => null)

	if (!code) {
		throw new OperationError(404, "Code not found")
	}

	return code
}
