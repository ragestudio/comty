import setFind from "@shared-utils/setFind"

export default async function (client) {
	try {
		const clientInst = setFind(this.clients, (c) => {
			return c.userId === client.userId
		})

		if (!clientInst) {
			return null
		}

		if (!clientInst.transports) {
			client.transports = new Map()
		}

		const clientIp =
			client.ip ||
			client.socket?.remoteAddress ||
			client.socket?.request?.connection?.remoteAddress ||
			client.socket?.request?.headers?.["x-forwarded-for"]
				?.split(",")[0]
				?.trim()

		let announcedIp = globalThis.process.env.MEDIASOUP_ANNOUNCED_IP

		if (!announcedIp) {
			announcedIp =
				globalThis.process.env.NODE_ENV === "production"
					? clientIp || "127.0.0.1"
					: "127.0.0.1"
		}

		const transportConfig = {
			listenIps: [
				{
					ip: globalThis.process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
					announcedIp: announcedIp,
				},
			],
			enableUdp: globalThis.process.env.MEDIASOUP_ENABLE_UDP !== "false",
			enableTcp: globalThis.process.env.MEDIASOUP_ENABLE_TCP !== "false",
			preferUdp: globalThis.process.env.MEDIASOUP_PREFER_UDP !== "false",
			maxIncomingBitrate:
				parseInt(
					globalThis.process.env.MEDIASOUP_MAX_INCOMING_BITRATE,
				) || 6000000,
			maxOutgoingBitrate:
				parseInt(
					globalThis.process.env.MEDIASOUP_MAX_OUTGOING_BITRATE,
				) || 8000000,
		}

		const transport =
			await this.router.createWebRtcTransport(transportConfig)

		clientInst.transports.set(transport.id, transport)

		this._setupTransportEvents(transport, clientInst)

		return {
			id: transport.id,
			iceParameters: transport.iceParameters,
			iceCandidates: transport.iceCandidates,
			dtlsParameters: transport.dtlsParameters,
		}
	} catch (error) {
		console.error(
			`Error creating WebRTC transport for ${client.userId}:`,
			error,
		)
		throw error
	}
}
