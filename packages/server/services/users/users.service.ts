import { Server } from "linebridge"

import ScyllaDb from "@ragestudio/scylla-odm"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"

import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
	static refName = "users"
	static routesPath = `${__dirname}/routes`
	static listenPort = 3008

	static bypassCors = true
	static useMiddlewares = ["logs"]

	static websockets = {
		enabled: true,
		path: "/users",
	}

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		redis: RedisClient(),
		scylla: (global.scylla = new ScyllaDb()),
	}

	initialize = [
		() => this.contexts.db.initialize().then(() => {}),
		() => this.contexts.redis.initialize().then(() => {}),
		() => this.contexts.scylla.initialize().then(() => {}),
	]
}

Boot(API)
