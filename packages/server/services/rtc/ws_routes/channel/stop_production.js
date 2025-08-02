export default async (client, payload) => {
	return await globalThis.mediaChannels.stopProduction(client, payload)
}
