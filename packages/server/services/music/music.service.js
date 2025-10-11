import { Server } from "linebridge"

import DbManager from "@shared-classes/DbManager"
import SSEManager from "@shared-classes/SSEManager"
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
		nats: {
			enabled: true,
		},
	}

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		SSEManager: new SSEManager(),
		redis: RedisClient(),
		userSyncRooms: new Map(),
	}

	async onInitialize() {
		global.sse = this.contexts.SSEManager
		global.redis = this.contexts.redis.client
		global.userSyncRooms = this.contexts.userSyncRooms
		global.syncRoomLyrics = new Map()

		await this.contexts.db.initialize()
		await this.contexts.redis.initialize()

		this.contexts.limits = await LimitsClass.get()
	}
}

Boot(API)
