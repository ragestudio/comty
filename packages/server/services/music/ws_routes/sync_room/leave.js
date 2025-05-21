export default async (client, user_id) => {
	console.log(`[SYNC-ROOM] Leave ${client.userId} -> ${user_id}`)

	// unsubscribe from sync topic
	await client.unsubscribe(`syncroom/${user_id}`)

	client.syncroom = null
}
