import leave from "./leave"

export default async (client, user_id) => {
	const currentRoom = global.userSyncRooms.get(client.userId)

	if (currentRoom) {
		await leave(client)
	}

	console.log(`[SYNC-ROOM] Join ${client.userId} -> ${user_id}`)

	// subscribe to stream topic
	global.userSyncRooms.set(client.userId, user_id)
	await client.subscribe(`syncroom/${user_id}`)
}
