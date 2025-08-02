export default async (client, payload) => {
	return await global.mediaChannels.unsubscribeGroupState(client, payload)
}
