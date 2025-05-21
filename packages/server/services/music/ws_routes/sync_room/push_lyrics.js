export default async (client, payload) => {
	console.log(`[SYNC-ROOM] Pushing lyrics to sync ${client.userId}`)

	const roomId = `syncroom/${client.userId}`

	if (!payload) {
		// delete lyrics
		global.syncRoomLyrics.delete(client.userId)
	} else {
		global.syncRoomLyrics.set(client.userId, payload)
	}

	global.websockets.senders.toTopic(roomId, "sync:lyrics:receive", payload)
}
