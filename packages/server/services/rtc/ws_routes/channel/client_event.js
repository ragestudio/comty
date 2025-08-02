export default async (client, payload) => {
	return await global.mediaChannels.handleClientEvent(client, payload)
}
