export default async (client, payload = {}) => {
	if (!payload.userId) {
		throw new OperationError(400, "Missing userId")
	}

	return await global.userCalls.dispatch(client, payload)
}
