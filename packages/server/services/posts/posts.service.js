import Server from "linebridge/src/server"

import ScyllaDb from "@shared-classes/ScyllaDb"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import TaskQueueManager from "@shared-classes/TaskQueueManager"

import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
	static refName = "posts"
	static listenPort = 3001

	static bypassCors = true
	static useMiddlewares = ["logs"]

	static websockets = {
		enabled: true,
		path: "/posts",
	}

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb()),
		redis: RedisClient(),
	}

	queuesManager = new TaskQueueManager({
		workersPath: `${__dirname}/queues`,
	})

	initialize = [
		() => this.contexts.db.initialize(),
		() => this.contexts.scylla.initialize(),
		() => this.contexts.redis.initialize(),
		() =>
			this.queuesManager.initialize({
				redisOptions: this.contexts.redis.client.options,
			}),
	]

	async onInitialize() {
		global.queues = this.queuesManager
	}
}

Boot(API)
