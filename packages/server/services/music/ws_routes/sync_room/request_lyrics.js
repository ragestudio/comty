export default async (client) => {
	const currentRoom = global.userSyncRooms.get(client.userId)

	if (!currentRoom) {
		return null
	}

	console.log(`[SYNC-ROOM] Requesting lyrics of room ${currentRoom}`)

	return global.syncRoomLyrics.get(currentRoom)
}
