import Server from "linebridge/src/server"

import ScyllaDb from "@shared-classes/ScyllaDb"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import UserConnections from "@shared-classes/UserConnections"

export default class API extends Server {
	static refName = "main"
	static listenPort = 3000

	static bypassCors = true
	static useMiddlewares = ["logs"]

	static websockets = {
		enabled: true,
		path: "/main",
	}

	middlewares = {
		...require("@middlewares").default,
		...require("@shared-middlewares").default,
	}

	onClientConnected = (ctx = {}) => {
		try {
			this.contexts.userConnections.handleConnection(
				this.contexts.redis.client,
				{
					socket_id: ctx.socket_id,
					user_id: ctx.meta.user_id,
				},
			)
		} catch (error) {
			console.error(error)
		}
	}

	onClientDisconnected = (ctx = {}) => {
		try {
			this.contexts.userConnections.handleDisconnection(
				this.contexts.redis.client,
				{
					socket_id: ctx.socket_id,
					user_id: ctx.meta.user_id,
				},
			)
		} catch (error) {
			console.error(error)
		}
	}

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb()),
		redis: RedisClient(),
		userConnections: new UserConnections(this),
	}

	initialize = [
		() => this.contexts.db.initialize(),
		() => this.contexts.scylla.initialize(),
		() => this.contexts.redis.initialize(),
	]

	async onInitialize() {
		if (this.nats) {
			await this.nats.subscribeToGlobalChannel(
				"connection",
				this.onClientConnected,
			)
			await this.nats.subscribeToGlobalChannel(
				"disconnection",
				this.onClientDisconnected,
			)
		}
	}
}

Boot(API)
