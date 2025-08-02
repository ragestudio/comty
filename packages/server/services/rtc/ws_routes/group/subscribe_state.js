export default async (client, payload) => {
	return await global.mediaChannels.subscribeGroupState(client, payload)
}
