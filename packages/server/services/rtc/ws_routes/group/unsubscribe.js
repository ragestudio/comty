export default async (client, group_id) => {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id is required")
	}

	// just unsubscribe from the topic
	await client.unsubscribe(`group:${group_id}`)

	return {
		ok: true,
		group_id: group_id,
	}
}
