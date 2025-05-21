import { Server } from "linebridge"

import DbManager from "@shared-classes/DbManager"
import SSEManager from "@shared-classes/SSEManager"
import RedisClient from "@shared-classes/RedisClient"

import SharedMiddlewares from "@shared-middlewares"
import LimitsClass from "@shared-classes/Limits"

import InjectedAuth from "@shared-lib/injectedAuth"

export default class API extends Server {
	static refName = "music"
	static listenPort = process.env.HTTP_LISTEN_PORT ?? 3003

	static websockets = {
		enabled: true,
		path: "/music",
	}

	static bypassCors = true

	static useMiddlewares = ["logs"]

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		SSEManager: new SSEManager(),
		redis: RedisClient(),
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

	async onInitialize() {
		global.sse = this.contexts.SSEManager
		global.redis = this.contexts.redis.client
		global.syncRoomLyrics = new Map()

		await this.contexts.db.initialize()
		await this.contexts.redis.initialize()

		this.contexts.limits = await LimitsClass.get()
	}
}

Boot(API)
