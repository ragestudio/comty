export default async (client, payload) => {
	return await global.mediaChannels.consume(client, payload)
}
