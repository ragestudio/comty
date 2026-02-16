import { Server } from "linebridge"

import ScyllaDb from "@shared-classes/ScyllaDb"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"

import SharedMiddlewares from "@shared-middlewares"
import InjectedAuth from "@shared-lib/injectedAuth"

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
		scylla: (global.scylla = new ScyllaDb()),
		redis: RedisClient(),
	}

	initialize = [
		() => this.contexts.db.initialize(),
		() => this.contexts.redis.initialize(),
		() => this.contexts.scylla.initialize(),
	]
}

Boot(API)
