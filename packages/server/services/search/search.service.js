import { Server } from "linebridge"

import ScyllaDb from "@ragestudio/scylla-odm"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"

import SharedMiddlewares from "@shared-middlewares"

export class API extends Server {
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

export default API
