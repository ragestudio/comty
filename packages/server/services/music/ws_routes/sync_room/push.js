export default async (client, payload) => {
	console.log(`[SYNC-ROOM] Pushing to sync ${client.userId}`, payload)

	const roomId = `syncroom/${client.userId}`

	global.websockets.senders.toTopic(roomId, "sync:receive", payload)
}
