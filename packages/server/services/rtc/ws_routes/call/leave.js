export default async (client, payload = {}) => {
	return await global.userCalls.leave(client, payload)
}
