import { Server } from "linebridge"
import crypto from "node:crypto"

import ScyllaDb from "@shared-classes/ScyllaDb"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import TaskQueueManager from "@shared-classes/TaskQueueManager"

import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
	static refName = "auth"
	static listenPort = 3020

	static bypassCors = true
	static useMiddlewares = ["logs"]
	static useEngine = "heng"

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		keys: {},
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb()),
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

	initialize = [
		() => this.contexts.db.initialize(),
		() => this.contexts.scylla.initialize(),
		() => this.contexts.redis.initialize(),
	]

	async onInitialize() {
		if (process.env.ECDSA_PUBLIC_KEY) {
			this.contexts.keys.jwk = crypto
				.createPublicKey(process.env.ECDSA_PUBLIC_KEY)
				.export({
					format: "jwk",
				})
		}

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
