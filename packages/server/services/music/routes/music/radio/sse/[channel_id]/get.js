export default async (req, res) => {
	const { channel_id } = req.params

	const radioId = channel_id.split("radio:")[1]

	let redisData = await redis.hgetall(`radio-${radioId}`).catch(() => null)

	global.sse.connectToChannelStream(channel_id, req, res, {
		initialData: {
			event: "update",
			data: redisData,
		},
	})
}
