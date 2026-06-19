import { Server } from "linebridge"
import path from "path"

import ScyllaDb from "@ragestudio/scylla-odm"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import UserConnections from "@shared-classes/UserConnections"

import type { RtEngineContext } from "linebridge/dist/classes/RtEngine/types"

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

	onClientConnected = (ctx: RtEngineContext) => {
		if (!ctx) return null
		if (!ctx.meta) return null

		try {
			this.contexts.userConnections.handleConnection({
				socket_id: ctx.socket_id,
				user_id: ctx.meta.user_id,
			})
		} catch (error) {
			console.error(error)
		}
	}

	onClientDisconnected = (ctx: RtEngineContext) => {
		if (!ctx) return null
		if (!ctx.meta) return null

		try {
			this.contexts.userConnections.handleDisconnection({
				socket_id: ctx.socket_id,
				user_id: ctx.meta.user_id,
			})
		} catch (error) {
			console.error(error)
		}
	}

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb({
			modelsPath: path.resolve(__dirname, "../../db"),
		})),
		redis: RedisClient(),
		userConnections: new UserConnections(this),
	}

	initialize = [
		() => this.contexts.db.initialize(),
		() =>
			this.contexts.scylla.initialize({
				sync: true,
			}),
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
