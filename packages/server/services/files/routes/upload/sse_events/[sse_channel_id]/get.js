export default async (req, res) => {
	const { sse_channel_id } = req.params

	global.sse.connectToChannelStream(sse_channel_id, req, res)
}
