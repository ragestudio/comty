import { Server } from "linebridge"

import { Worker as SnowflakeWorker } from "snowflake-uuid"

import DbManager from "@shared-classes/DbManager"
import ScyllaDb from "@shared-classes/ScyllaDb"
import RedisClient from "@shared-classes/RedisClient"
import SharedMiddlewares from "@shared-middlewares"

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
			contactPoints: ["172.17.0.2"],
			localDataCenter: "datacenter1",
			keyspace: "comty",
		})),
		snowflake: (global.snowflake = new SnowflakeWorker(0, 1)),
	}

	initialize = [
		() => this.contexts.db.initialize(),
		() => this.contexts.redis.initialize(),
		() => this.contexts.scylla.initialize(),
	]
}

Boot(API)
