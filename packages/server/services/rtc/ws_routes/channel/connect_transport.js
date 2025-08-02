export default async (client, payload) => {
	return await global.mediaChannels.connectTransport(client, payload)
}
