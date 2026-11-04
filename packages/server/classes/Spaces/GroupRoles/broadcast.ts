export const broadcastRolesUpdated = (
	group_id: string,
	payload: Record<string, any> = {},
): void => {
	if (!global.websockets) return

	try {
		global.websockets.senders.toTopic(
			`group:${group_id}`,
			`group:${group_id}:roles:updated`,
			{
				group_id,
				...payload,
			},
		)
	} catch (error) {
		console.error("Failed to broadcast roles update", error)
	}
}
