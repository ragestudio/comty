import GroupModel from "@models/groups"
import Client from "../classes/Client"
import { Device } from "mediasoup-client"

export default async function (groupId, channelId) {
	try {
		if (this.state.isJoined) {
			await this.handlers.leaveChannel()
		}

		this.state.isLoading = true

		// create device
		this.device = await Device.factory()

		// fetch channel data
		const channelData = await GroupModel.channels.get(groupId, channelId)

		this.console.log("Joining channel...", {
			groupId,
			channelId,
			self: this,
		})

		const data = await this.socket.call("channel:join", channelData._id)

		this.state.channel = channelData
		this.state.channelId = channelData._id

		// load device
		await this.device.load({
			routerRtpCapabilities: data.rtpCapabilities,
		})

		// set all clients
		for (let client of data.clients) {
			this.clients.set(client.userId, new Client(this, client))
		}

		// dispatch sfx
		app.cores.sfx.play("media_channel_join")

		await this.self.createMicStream()

		// resume audio context
		if (this.self.audioOutput.state === "suspended") {
			await this.self.audioOutput.resume()
		}

		// create and setup transports
		await this.handlers.createTransports()

		// start audio producer
		await this.self.startMicProducer()

		// start ui
		if (this.ui) {
			this.ui.attach()
		}

		// sync producers & clients mic
		if (data.producers && Array.isArray(data.producers)) {
			for (const producer of data.producers) {
				// if is self producer, skip
				if (producer.userId === app.userData._id) {
					continue
				}

				// add to producers
				this.producers.set(producer.producerId, producer)

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

		this.console.log("Joined channel", {
			groupId,
			channelId,
			clients: data.clients,
		})
	} catch (error) {
		this.state.isLoading = false

		console.error(error)

		this.console.error(error)
		this.console.error(error.stack)

		app.cores.notifications.new({
			title: "Failed to join channel",
			message: error.message,
			type: "error",
		})
	}
}
