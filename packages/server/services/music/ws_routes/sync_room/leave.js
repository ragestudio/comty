export default async (client) => {
	const currentRoom = global.userSyncRooms.get(client.userId)

	if (!currentRoom) {
		return null
	}

	console.log(`[SYNC-ROOM] Leave ${client.userId} -> ${currentRoom}`)

	// unsubscribe from sync topic
	global.userSyncRooms.delete(client.userId)
	await client.unsubscribe(`syncroom/${currentRoom}`)
}
