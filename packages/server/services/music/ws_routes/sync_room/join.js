import leave from "./leave"

export default async (client, user_id) => {
	console.log(`[SYNC-ROOM] Join ${client.userId} -> ${user_id}`)

	if (client.syncroom) {
		await leave(client, client.syncroom)
	}

	// subscribe to stream topic
	await client.subscribe(`syncroom/${user_id}`)
	client.syncroom = user_id
}
