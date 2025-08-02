export default async (client, payload) => {
	return await global.mediaChannels.produce(client, payload)
}
