export default async function ({ groupId, event, payload }) {
	globalThis.websockets.senders.toTopic(
		groupId,
		`group:${groupId}:state:update`,
		{
			event: event,
			payload: payload,
		},
	)
}
