export default async function (client, payload) {
	try {
		if (!this.clients.has(client)) {
			throw new Error("Client not in channel")
		}

		const { transportId, dtlsParameters } = payload
		const transport = client.transports.get(transportId)

		if (!transport) {
			throw new Error("Transport not found")
		}

		await transport.connect({ dtlsParameters })
	} catch (error) {
		console.error(`Error connecting transport for ${client.userId}:`, error)
		throw error
	}
}
