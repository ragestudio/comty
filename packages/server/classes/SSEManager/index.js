import SSEChannel from "../SSEChannel"

export default class SSEManager {
	channels = new Map()

	createChannel(channelId) {
		const channel = new SSEChannel({
			id: channelId,
		})

		this.channels.set(channelId, channel)

		return channel
	}

	sendToChannel(channelId, ...args) {
		if (!this.channels.has(channelId)) {
			this.createChannel(channelId)
		}

		const channel = this.channels.get(channelId)

		if (!channel) {
			throw new Error("Channel not found")
		}

		//channel.cache.push(args)
		channel.eventBus.emit("data", ...args)
	}

	connectToChannelStream = (channelId, req, res, { initialData } = {}) => {
		let channel = this.channels.get(channelId)

		if (!channel) {
			channel = this.createChannel(channelId)
		}

		res.setHeader("Content-Type", "text/event-stream")
		res.setHeader("Cache-Control", "no-cache")
		res.setHeader("Connection", "keep-alive")
		res.setHeader("X-Accel-Buffering", "no")
		res.status(200)

		this.writeJSONToResponse(res, {
			event: "connected",
		})

		req.healthPingInterval = setInterval(() => {
			this.writeJSONToResponse(res, {
				event: "ping",
			})
		}, 5000)

		channel.clients.add(req)

		if (channel.cache.length > 0) {
			for (const oldData of channel.cache) {
				this.writeJSONToResponse(res, oldData)
			}
		}

		if (initialData) {
			this.writeJSONToResponse(res, initialData)
		}

		channel.eventBus.on("data", (data) => {
			this.writeJSONToResponse(res, data)
		})

		req.on("close", () => {
			clearInterval(req.healthPingInterval)

			channel.clients.delete(req)

			if (channel.clients.size === 0) {
				this.channels.delete(channelId)
			}

			res.end()
		})
	}

	writeJSONToResponse = (res, data) => {
		res.write("data: " + JSON.stringify(data) + "\n\n")
	}

	getChannel = (channelId) => {
		return this.channels.get(channelId)
	}
}
