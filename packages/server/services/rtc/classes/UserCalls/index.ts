import MediaChannel from "../MediaChannel"
import * as mediasoup from "mediasoup"
import getAnnouncedIp from "../../utils/getAnnouncedIp"

type DispatchCallPayload = {
	userId: string
	alternativeSfx?: string
}

export default class UserCalls {
	constructor(server: any) {
		this.server = server
	}
	server: any

	worker: mediasoup.types.Worker = null
	webrtcServer: mediasoup.types.WebRtcServer = null

	instances: Map<string, MediaChannel> = new Map()
	usersMap: Map<string, string> = new Map()

	async initialize() {
		this.worker = await mediasoup.createWorker()
		this.webrtcServer = await this.worker.createWebRtcServer({
			listenInfos: [
				{
					protocol: "udp",
					ip: "0.0.0.0",
					announcedIp: getAnnouncedIp(),
					port: 41000,
				},
				{
					protocol: "tcp",
					ip: "0.0.0.0",
					announcedIp: getAnnouncedIp(),
					port: 41000,
				},
			],
		})
	}

	async dispatch(client: RTEClient, payload: DispatchCallPayload) {
		const { userId, alternativeSfx } = payload

		if (!client) {
			throw new OperationError(400, "Missing rte client")
		}

		if (!userId) {
			throw new OperationError(400, "Missing userId")
		}

		console.log("calling user", userId)

		// try to emit event to the user
		const targetClients =
			await this.server.engine.ws.find.clientsByUserId(userId)

		for (const targetClient of targetClients) {
			await targetClient.emit("call:incoming", {
				userId: client.userId,
				alternativeSfx: alternativeSfx,
			})
		}

		// create a new media channel for only this two users
		const roomId = `DM:${global.nanoid()}`

		const room = new MediaChannel({
			data: {
				_id: roomId,
			},
			channelId: roomId,
			worker: this.worker,
			webrtcServer: this.webrtcServer,
			controller: this,
		})

		await room.initialize()

		this.instances.set(roomId, room)
		this.usersMap.set(client.userId, roomId)

		return await room.joinClient(client)
	}

	async leave(client: RTEClient, payload: any) {
		if (!client) {
			throw new OperationError(400, "Missing rte client")
		}

		const channel = this.getClientChannel(client)

		if (!channel) {
			throw new Error("No media channel joined")
		}

		this.usersMap.delete(client.userId)
		return channel.leaveClient(client)
	}

	getClientChannel(client: RTEClient): MediaChannel {
		const currentUserMediaChannel = this.usersMap.get(client.userId)

		if (!currentUserMediaChannel) {
			throw new Error("No media channel joined")
		}

		const channelInstance = this.instances.get(currentUserMediaChannel)

		if (!channelInstance) {
			throw new Error("Media channel instance not found")
		}

		return channelInstance
	}
}
