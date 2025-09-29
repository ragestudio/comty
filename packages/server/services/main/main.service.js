//import Server from "../../../../linebridge/server/src/server"
import { Server } from "linebridge"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import UserConnections from "@shared-classes/UserConnections"

export default class API extends Server {
	static refName = "main"
	static listenPort = process.env.HTTP_LISTEN_PORT ?? 3000

	static useMiddlewares = ["logs"]
	static bypassCors = true

	static websockets = {
		enabled: true,
		path: "/main",
		nats: {
			enabled: true,
		},
	}

	middlewares = {
		...require("@middlewares").default,
		...require("@shared-middlewares").default,
	}

	handleWsConnection = async (socket) => {
		if (socket.context.user) {
			console.log(`@${socket.context.user.username} connected`)

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
		if (socket.context.user) {
			console.log(`@${socket.context.user.username} disconnected`)

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
