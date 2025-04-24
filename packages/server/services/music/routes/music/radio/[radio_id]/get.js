export default async (req, res) => {
	const radioId = req.params.radio_id

	let redisData = await redis.hgetall(`radio-${radioId}`).catch(() => null)

	return redisData
}
