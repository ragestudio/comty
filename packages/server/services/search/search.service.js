import { Server } from "linebridge"

import ScyllaDb from "@shared-classes/ScyllaDb"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"

import SharedMiddlewares from "@shared-middlewares"

class API extends Server {
	static refName = "search"
	static listenPort = 3010

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

	initialize = [
		() => this.contexts.db.initialize(),
		() => this.contexts.scylla.initialize(),
		() => this.contexts.redis.initialize(),
	]
}

Boot(API)
