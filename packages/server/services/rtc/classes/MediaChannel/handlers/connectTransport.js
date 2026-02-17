import setFind from "@shared-utils/setFind"

export default async function (client, payload) {
	try {
		const clientInst = setFind(this.clients, (c) => {
			return c.userId === client.userId
		})

		if (!clientInst) {
			throw new Error("Client not in channel")
		}

		const { transportId, dtlsParameters } = payload
		const transport = clientInst.transports.get(transportId)

		if (!transport) {
			throw new Error("Transport not found")
		}

		await transport.connect({ dtlsParameters })
	} catch (error) {
		console.error(`Error connecting transport for ${client.userId}:`, error)
		throw error
	}
}
