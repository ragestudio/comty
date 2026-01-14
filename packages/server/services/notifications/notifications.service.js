import { Server } from "linebridge"

import ScyllaDb from "@shared-classes/ScyllaDb"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"

import SharedMiddlewares from "@shared-middlewares"

class API extends Server {
	static refName = "notifications"
	static listenPort = 3009

	static bypassCors = true
	static useMiddlewares = ["logs"]

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb()),
		redis: RedisClient(),
	}

	async onInitialize() {
		await this.contexts.db.initialize()
		await this.contexts.scylla.initialize()
		await this.contexts.redis.initialize()
	}
}

Boot(API)
