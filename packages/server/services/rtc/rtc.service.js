//import { Server } from "../../../../linebridge/server/src"
import { Server } from "linebridge"

import ScyllaDb from "@shared-classes/ScyllaDb"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import SharedMiddlewares from "@shared-middlewares"

import MediaChannelsController from "@classes/MediaChannelsController"
import UserCalls from "@classes/UserCalls"

export default class API extends Server {
	static refName = "rtc"
	static listenPort = 3011

	static useMiddlewares = ["logs"]
	static bypassCors = true

	static websockets = {
		enabled: true,
		path: "/rtc",
		nats: {
			enabled: true,
		},
	}

	middlewares = {
		...SharedMiddlewares,
	}

	handleWsConnection = (socket) => {
		if (socket.context.user) {
			console.log(`[WS] @${socket.context.user.username} connected`)
			this.eventBus.emit("user:connected", socket.context.user._id)
		}
	}

	handleWsDisconnect = async (socket) => {
		if (socket.context.user) {
			console.log(`[WS] @${socket.context.user.username} disconnected`)
			this.eventBus.emit("user:disconnect", socket.context.user._id)
		}
	}

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb()),
		redis: RedisClient(),
		mediaChannels: new MediaChannelsController(this),
		userCalls: new UserCalls(this),
	}

	async onInitialize() {
		await this.contexts.db.initialize()
		await this.contexts.scylla.initialize()
		await this.contexts.redis.initialize()
		await this.contexts.mediaChannels.initialize()
		await this.contexts.userCalls.initialize()

		global.mediaChannels = this.contexts.mediaChannels
		global.userCalls = this.contexts.userCalls
	}
}

Boot(API)
