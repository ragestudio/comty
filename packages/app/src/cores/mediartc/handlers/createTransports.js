const sendTransportHandlers = {
	connect: async function ({ dtlsParameters }, callback, errback) {
		try {
			await this.socket.call("channel:connect_transport", {
				transportId: this.sendTransport.id,
				dtlsParameters,
			})

			callback()
		} catch (error) {
			this.console.error("Send transport connection failed:", error)
			errback(error)
		}
	},
	produce: async function (
		{ kind, rtpParameters, appData },
		callback,
		errback,
	) {
		try {
			const result = await this.socket.call("channel:produce", {
				transportId: this.sendTransport.id,
				kind,
				rtpParameters,
				appData,
			})

			callback({ id: result.id })
		} catch (error) {
			this.console.error("Producer creation failed:", error)
			errback(error)
		}
	},
	close: async function (data) {
		console.log("send transport close", data)
	},
	connectionstatechange: function (state) {
		console.log("connectionstatechange", state)
		if (state === "failed") {
			this.console.error("Send transport failed")
		}
	},
}

const recvTransportHandlers = {
	connect: async function ({ dtlsParameters }, callback, errback) {
		try {
			await this.socket.call("channel:connect_transport", {
				transportId: this.recvTransport.id,
				dtlsParameters,
			})

			callback()
		} catch (error) {
			this.console.error("Receive transport connection failed:", error)
			errback(error)
		}
	},
	connectionstatechange: function (state) {
		if (state === "failed") {
			this.console.error("Receive transport failed")
		}
	},
	close: async function (data) {
		console.log("recv transport close", data)
	},
}

export default async function () {
	const sendTransportInfo = await this.socket.call("channel:create_transport")

	this.sendTransport = this.device.createSendTransport({
		id: sendTransportInfo.id,
		iceParameters: sendTransportInfo.iceParameters,
		iceCandidates: sendTransportInfo.iceCandidates,
		dtlsParameters: sendTransportInfo.dtlsParameters,
	})

	const recvTransportInfo = await this.socket.call("channel:create_transport")

	this.recvTransport = this.device.createRecvTransport({
		id: recvTransportInfo.id,
		iceParameters: recvTransportInfo.iceParameters,
		iceCandidates: recvTransportInfo.iceCandidates,
		dtlsParameters: recvTransportInfo.dtlsParameters,
	})

	for (const [event, handler] of Object.entries(sendTransportHandlers)) {
		this.sendTransport.on(event, handler.bind(this))
	}

	for (const [event, handler] of Object.entries(recvTransportHandlers)) {
		this.recvTransport.on(event, handler.bind(this))
	}
}
