export default async (client, payload) => {
	console.log("Client emitted test event", payload)

	client.emit("test:ok", payload)
}
