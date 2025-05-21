export default async (client) => {
	console.log(`[SYNC-ROOM] Requesting lyrics of room ${client.syncroom}`)

	return global.syncRoomLyrics.get(client.syncroom)
}
