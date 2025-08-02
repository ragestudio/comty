//import { Server } from "linebridge"
import { Server } from "../../../../linebridge/server/src"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import InjectedAuth from "@shared-lib/injectedAuth"
import SharedMiddlewares from "@shared-middlewares"

import MediaChannelsController from "@classes/MediaChannelsController"

export default class API extends Server {
	static refName = "rtc"
	static listenPort = process.env.HTTP_LISTEN_PORT ?? 3011

	static useMiddlewares = ["logs"]
	static bypassCors = true
	static websockets = {
		enabled: true,
		path: "/rtc",
	}

	middlewares = {
		...SharedMiddlewares,
	}

	handleWsUpgrade = async (context, token, res) => {
		if (!token) {
			return res.upgrade(context)
		}

		context = await InjectedAuth(context, token, res).catch(() => {
			res.close(401, "Failed to verify auth token")
			return false
		})

		if (!context || !context.user) {
			res.close(401, "Unauthorized or missing auth token")
			return false
		}

		return res.upgrade(context)
	}

	handleWsConnection = (socket) => {
		if (socket.context.user) {
			console.log(`[WS] @${socket.context.user.username} connected`)
		}
	}

	handleWsDisconnect = async (socket, client) => {
		if (socket.context.user) {
			console.log(`[WS] @${socket.context.user.username} disconnected`)
		}

		// Clean up media channel resources
		try {
			await global.mediaChannels.leaveClient(client)
		} catch (error) {
			console.error("Error cleaning up media channel on disconnect:", error)
		}
	}

	contexts = {
		db: new DbManager(),
		redis: RedisClient(),
		mediaChannels: new MediaChannelsController(this),
	}

	async onInitialize() {
		await this.contexts.db.initialize()
		await this.contexts.redis.initialize()
		await this.contexts.mediaChannels.initialize()

		global.mediaChannels = this.contexts.mediaChannels
	}
}

Boot(API)
