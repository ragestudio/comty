import { Server } from "linebridge"
import crypto from "node:crypto"

import ScyllaDb from "@ragestudio/scylla-odm"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import TaskQueueManager from "@shared-classes/TaskQueueManager"

import SharedMiddlewares from "@shared-middlewares"
import OAuthProvider from "@classes/oauth"

export default class API extends Server {
	static refName = "auth"
	static listenPort = 3020

	static useMiddlewares = ["logs"]

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		keys: {} as Record<string, any>,
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb({
			modelsPath: `${global.paths.root}/db`,
		})),
		redis: RedisClient({
			maxRetriesPerRequest: null,
		}),
		oauth: new OAuthProvider(),
	}

	queuesManager = new TaskQueueManager({
		workersPath: `${__dirname}/queues`,
	})

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

		// ensure ttl index for oauth codes
		try {
			await this.contexts.oauth.ensureTTLIndex()
		} catch (err) {
			console.warn("oauth ttl index creation failed:", err.message)
		}
	}

	onExit() {
		this.queuesManager.cleanUp()
	}
}

Boot(API)
