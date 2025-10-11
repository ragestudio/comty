import { Server } from "linebridge"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import TaskQueueManager from "@shared-classes/TaskQueueManager"

import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
	static refName = "auth"
	static listenPort = 3020

	static bypassCors = true
	static useMiddlewares = ["logs"]

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		redis: RedisClient({
			maxRetriesPerRequest: null,
		}),
	}

	queuesManager = new TaskQueueManager(
		{
			workersPath: `${__dirname}/queues`,
		},
		this,
	)

	async onInitialize() {
		await this.contexts.redis.initialize()
		await this.contexts.db.initialize()
		await this.queuesManager.initialize({
			redisOptions: this.contexts.redis.client.options,
		})
		global.queues = this.queuesManager
	}

	onExit() {
		this.queuesManager.cleanUp()
	}
}

Boot(API)
