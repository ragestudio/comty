const REDEEM_RATE_LIMIT = 20
const REDEEM_RATE_WINDOW_SECONDS = 600

export async function enforceRedeemRateLimit(redis: any, user_id: string) {
	const key = `redeem:attempts:${user_id}`

	try {
		const attempts = await redis.client.incr(key)

		if (attempts === 1) {
			await redis.client.expire(key, REDEEM_RATE_WINDOW_SECONDS)
		}

		if (attempts > REDEEM_RATE_LIMIT) {
			throw new OperationError(
				429,
				"Too many attempts, please try again later",
			)
		}
	} catch (error) {
		if (error instanceof OperationError) {
			throw error
		}

		console.error("Failed to apply redeem rate limit", error)
	}
}
