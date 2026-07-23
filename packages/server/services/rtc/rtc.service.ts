import type { RtEngineContext } from "linebridge/dist/classes/RtEngine/types"

import { Server } from "linebridge"

import ScyllaDb from "@ragestudio/scylla-odm"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import SharedMiddlewares from "@shared-middlewares"
import UserConnections from "@shared-classes/UserConnections"

import MediaChannelsController from "@classes/MediaChannelsController"
import UserCalls from "@classes/UserCalls"
import { Worker as SnowflakeWorker } from "@shared-classes/Snowflake"

export default class API extends Server {
	static refName = "rtc"
	static listenPort = 3011

	static useMiddlewares = ["logs"]
	static bypassCors = true

	static websockets = {
		enabled: true,
		path: "/rtc",
	}

	middlewares = {
		...SharedMiddlewares,
	}

	onClientConnected = (ctx: RtEngineContext) => {
		if (typeof ctx.meta.user_id === "string") {
			this.eventBus.emit("user:connected", ctx)
		}
	}

	onClientDisconnected = (ctx: RtEngineContext) => {
		if (typeof ctx.meta.user_id === "string") {
			this.eventBus.emit("user:disconnect", ctx)
		}
	}

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb()),
		redis: RedisClient(),
		mediaChannels: new MediaChannelsController(this),
		userCalls: new UserCalls(this),
		userConnections: new UserConnections(this),
		snowflake: (global.snowflake = new SnowflakeWorker()),
	}

	initialize = [
		() => this.contexts.db.initialize(),
		() => this.contexts.scylla.initialize(),
		() => this.contexts.redis.initialize(),
		() => this.contexts.mediaChannels.initialize(),
		() => this.contexts.userCalls.initialize(),
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

		global.mediaChannels = this.contexts.mediaChannels
		global.userCalls = this.contexts.userCalls
	}
}

Boot(API)
