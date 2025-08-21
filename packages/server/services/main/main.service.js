import { Server } from "linebridge"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import UserConnections from "@shared-classes/UserConnections"

import InjectedAuth from "@shared-lib/injectedAuth"

export default class API extends Server {
	static refName = "main"
	static listenPort = process.env.HTTP_LISTEN_PORT ?? 3000

	static useMiddlewares = ["logs"]
	static bypassCors = true
	static websockets = {
		enabled: true,
		path: "/main",
	}

	middlewares = {
		...require("@middlewares").default,
		...require("@shared-middlewares").default,
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

	handleWsConnection = async (socket) => {
		// perform only authenticated sockets operations
		if (socket.context.user) {
			console.log(`[WS] @${socket.context.user.username} connected`)

			try {
				this.contexts.userConnections.handleConnection(
					this.contexts.redis.client,
					socket,
					socket.context.user,
				)
			} catch (error) {
				console.error(error)
			}
		}
	}

	handleWsDisconnect = async (socket) => {
		// perform only authenticated sockets operations

		if (socket.context.user) {
			console.log(`[WS] @${socket.context.user.username} disconnected`)

			try {
				this.contexts.userConnections.handleDisconnection(
					this.contexts.redis.client,
					socket,
					socket.context.user,
				)
			} catch (error) {
				console.error(error)
			}
		}
	}

	contexts = {
		db: new DbManager(),
		redis: RedisClient(),
		userConnections: new UserConnections(this),
	}

	async onInitialize() {
		await this.contexts.db.initialize()
		await this.contexts.redis.initialize()
	}
}

Boot(API)
