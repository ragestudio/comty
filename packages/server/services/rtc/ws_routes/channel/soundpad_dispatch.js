export default async (client, payload) => {
	return await global.mediaChannels.handleSoundpadDispatch(client, payload)
}
