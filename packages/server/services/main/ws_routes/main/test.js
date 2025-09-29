export default {
	fn: async (client, payload) => {
		console.log("Client emitted test event")

		client.emit("test:event", "hii, this is a emit test")

		return parseInt(payload.n1) + parseInt(payload.n2)
	},
}
