import MediaRTC from "../mediartc.core"
import { Device } from "mediasoup-client"
import Client from "../classes/Client"

export default async function (this: MediaRTC, data: any) {
	try {
		if (this.state.isJoined) {
			await this.handlers.leaveChannel()
		}

		this.state.isLoading = true

		// create device
		this.device = await Device.factory()

		await this.self.createMicStream()

		// resume audio context
		if (this.self.audioOutput?.state === "suspended") {
			await this.self.audioOutput.resume()
		}

		// start ui
		if (this.ui) {
			this.ui.attach()
		}

		// load device
		await this.device.load({
			routerRtpCapabilities: data.rtpCapabilities,
		})

		// set all clients
		for (let client of data.clients) {
			this.clients.set(client.userId, new Client(this, client))
		}

		// create and setup transports
		await this.handlers.createTransports()

		// start audio producer
		await this.self.startMicProducer()

		// sync producers & clients mic
		if (data.producers && Array.isArray(data.producers)) {
			for (const producer of data.producers) {
				// if is self producer, skip
				if (producer.userId === app.userData._id) {
					continue
				}

				// add to producers
				this.producers.setRemote(producer)

				const client = this.clients.get(producer.userId)

				if (client) {
					// attach current client mic
					if (producer.appData.mediaTag === "user-mic") {
						await client.attachMic({
							producerId: producer.producerId,
							userId: producer.userId,
							kind: producer.kind,
							appData: producer.appData,
						})
					}
				}
			}
		}

		this.state.isJoined = true
		this.state.isLoading = false
		this.state.connectedAt = new Date()

		this.console.log("Joined channel", data)
	} catch (error) {
		this.console.error(error)
		this.console.error(error.stack)

		this.state.isJoined = false
		this.state.isLoading = false

		// during recovery, keep UI visible and streams alive
		if (!this.autoRecovery.isRecovering) {
			if (this.ui) {
				this.ui.detach()
			}

			this.self.stopAll()

			app.cores.notifications.new({
				title: "Failed to join channel",
				message: error.message,
				type: "error",
			})
		}

		throw error
	}
}
