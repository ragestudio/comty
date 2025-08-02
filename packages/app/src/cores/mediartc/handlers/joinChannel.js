import { Device } from "mediasoup-client"
import GroupModel from "@models/groups"

export default async function (groupId, channelId) {
	try {
		// TODO: leave channel first
		if (this.state.isJoined) {
			await this.handlers.leaveChannel()
		}

		this.state.isLoading = true

		// fetch channel data
		this.state.channel = await GroupModel.channels.get(groupId, channelId)
		this.state.channelId = this.state.channel._id

		this.console.log("Joining channel...", {
			groupId,
			channelId,
			self: this,
		})

		const data = await this.socket.call("channel:join", channelId)

		// set all clients
		this.state.clients = data.clients

		// start ui
		if (this.ui) {
			this.ui.attach()
		}

		// dispatch sfx
		app.cores.sfx.play("media_channel_join")

		// set device
		await this.handlers.initializeUserAudio()

		// resume audio context
		if (this.audioOutput.state === "suspended") {
			await this.audioOutput.resume()
		}

		// create and load device
		this.device = new Device()

		await this.device.load({ routerRtpCapabilities: data.rtpCapabilities })

		// create and setup transports
		await this.handlers.createTransports()

		// start audio producer
		await this.handlers.startAudioProducer()

		// sync producers & clients mic
		if (data.producers && Array.isArray(data.producers)) {
			for (const producer of data.producers) {
				// attach current client mic
				if (producer.appData.mediaTag === "user-mic") {
					await this.handlers.startClientMic({
						producerId: producer.producerId,
						userId: producer.userId,
						kind: producer.kind,
						appData: producer.appData,
					})
				}

				// add to producers
				this.producers.set(producer.producerId, producer)
			}
		}

		// start self voice detection
		await this.handlers.startVoiceDetector(
			this.audioStream,
			app.userData._id,
		)

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
