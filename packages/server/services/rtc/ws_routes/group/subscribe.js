export default async (client, group_id) => {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id is required")
	}

	// first validate if this client can access this group
	await global.mediaChannels.validateGroupAccess(client.userId, group_id)

	// now subscribe to the topic
	await client.subscribe(`group:${group_id}`)

	return {
		ok: true,
		group_id: group_id,
	}
}
