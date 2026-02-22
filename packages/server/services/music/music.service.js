import Server from "linebridge/src/server"

import ScyllaDb from "@shared-classes/ScyllaDb"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"

import SharedMiddlewares from "@shared-middlewares"
import LimitsClass from "@shared-classes/Limits"

export default class API extends Server {
	static refName = "music"
	static listenPort = 3003

	static bypassCors = true
	static useMiddlewares = ["logs"]

	static websockets = {
		enabled: true,
		path: "/music",
	}

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb()),
		redis: RedisClient(),
		userSyncRooms: new Map(),
	}

	initialize = [
		() => this.contexts.db.initialize(),
		() => this.contexts.scylla.initialize(),
		() => this.contexts.redis.initialize(),
	]

	async onInitialize() {
		global.redis = this.contexts.redis.client
		global.userSyncRooms = this.contexts.userSyncRooms
		global.syncRoomLyrics = new Map()

		this.contexts.limits = await LimitsClass.get()
	}
}

Boot(API)
