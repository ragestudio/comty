export default async (client, media_channel_id) => {
	return await global.mediaChannels.joinClient(client, media_channel_id)
}
