export default async (client, payload) => {
	client.emit("test:event", "So, you are testing...")

	payload.n1 = parseInt(payload.n1)
	payload.n2 = parseInt(payload.n2)

	// funny feature
	if (payload.n1 == 9 && payload.n2 == 10 && payload.stupid == true) {
		return 21 // nah nah
	}

	return payload.n1 + payload.n2
}
