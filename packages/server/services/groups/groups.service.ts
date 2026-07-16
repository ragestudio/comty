import { Server } from "linebridge"

import { Worker as SnowflakeWorker } from "@shared-classes/Snowflake"

import DbManager from "@shared-classes/DbManager"
import ScyllaDb from "@ragestudio/scylla-odm"
import RedisClient from "@shared-classes/RedisClient"
import SharedMiddlewares from "@shared-middlewares"
import UserConnections from "@shared-classes/UserConnections"

export default class API extends Server {
	static refName = "groups"
	static listenPort = 3012

	static useMiddlewares = ["logs"]
	static bypassCors = true

	static websockets = {
		enabled: true,
		path: "/groups",
	}

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		redis: RedisClient(),
		scylla: (global.scylla = new ScyllaDb({
			modelsPath: global["paths"].root + "/db",
		})),
		snowflake: (global.snowflake = new SnowflakeWorker(0, 1)),
		usersConnections: new UserConnections(this),
	}

	initialize = [
		() => this.contexts.db.initialize(),
		() => this.contexts.redis.initialize(),
		() => this.contexts.scylla.initialize(),
	]
}

Boot(API)
