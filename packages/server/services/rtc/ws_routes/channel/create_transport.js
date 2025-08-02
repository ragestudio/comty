export default async (client, media_channel_id) => {
	return await global.mediaChannels.createWebRtcTransport(
		client,
		media_channel_id,
	)
}
