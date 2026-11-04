import { Server } from "linebridge"

import ScyllaDb from "@ragestudio/scylla-odm"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import UserConnections from "@shared-classes/UserConnections"

import SharedMiddlewares from "@shared-middlewares"

export class API extends Server {
	static refName = "users"
	static routesPath = `${import.meta.dirname}/routes`
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
		usersConnections: new UserConnections(this),
	}

	initialize = [
		() => this.contexts.db.initialize().then(() => {}),
		() => this.contexts.redis.initialize().then(() => {}),
		() => this.contexts.scylla.initialize().then(() => {}),
	]
}

export default API
