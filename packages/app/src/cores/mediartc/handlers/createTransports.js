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
	connectionstatechange: function (state) {
		console.log("[webrtc] [send:transport] state changed: ", state)

		this.state.sendTransportState = state

		if (state === "failed") {
			this.console.error("Send transport failed")
		}
	},
}

const sendTransportObserver = {
	close: async function () {
		console.debug("[webrtc] [send:transport] closed")

		this.state.sendTransportState = "closed"
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
		console.log("[webrtc] [recv:transport] state changed: ", state)

		this.state.recvTransportState = state

		if (state === "failed") {
			this.console.error("Receive transport failed")
		}
	},
}

const recvTransportObserver = {
	close: async function () {
		console.log("[webrtc] [recv:transport] closed")

		this.state.recvTransportState = "closed"
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

	for (const [event, handler] of Object.entries(sendTransportObserver)) {
		this.sendTransport.observer.on(event, handler.bind(this))
	}

	for (const [event, handler] of Object.entries(recvTransportHandlers)) {
		this.recvTransport.on(event, handler.bind(this))
	}

	for (const [event, handler] of Object.entries(recvTransportObserver)) {
		this.recvTransport.observer.on(event, handler.bind(this))
	}
}
