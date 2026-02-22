import Server from "linebridge/src/server"

import ScyllaDb from "@shared-classes/ScyllaDb"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import StorageClient from "@shared-classes/StorageClient"
import CacheService from "@shared-classes/CacheService"
import LimitsClass from "@shared-classes/Limits"
import TaskQueueManager from "@shared-classes/TaskQueueManager"
import Capabilities from "@classes/Capabilities"

import SharedMiddlewares from "@shared-middlewares"

class API extends Server {
	static refName = "files"
	static listenPort = 3002

	static bypassCors = true
	static useMiddlewares = ["logs"]

	static websockets = {
		enabled: true,
		path: "/files",
	}

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb()),
		redis: (global.redis = RedisClient({
			maxRetriesPerRequest: null,
		})),
		cache: (global.cache = new CacheService()),
		storage: StorageClient(),
		b2Storage: null,
		limits: {},
		capabilities: new Capabilities(),
	}

	queuesManager = (global.queues = new TaskQueueManager(
		{
			workersPath: `${__dirname}/queues`,
		},
		this,
	))

	initialize = [
		() => this.contexts.db.initialize(),
		() => this.contexts.scylla.initialize(),
		() => this.contexts.redis.initialize(),
		() => this.contexts.capabilities.initialize(),
	]

	async onInitialize() {
		console.log("Server Capabilities:", this.contexts.capabilities)

		await this.queuesManager.initialize({
			redisOptions: this.contexts.redis.client,
		})

		this.contexts.limits = await LimitsClass.get()

		if (process.env.B2_KEY_ID && process.env.B2_APP_KEY) {
			this.contexts.b2Storage = StorageClient({
				endPoint: process.env.B2_ENDPOINT,
				cdnUrl: process.env.B2_CDN_ENDPOINT,
				defaultBucket: process.env.B2_BUCKET,
				accessKey: process.env.B2_KEY_ID,
				secretKey: process.env.B2_APP_KEY,
				port: 443,
				useSSL: true,
				setupBucket: false,
			})

			await this.contexts.b2Storage.initialize()
		}

		await this.contexts.storage.initialize()

		global.storages = {
			standard: this.contexts.storage,
			b2: this.contexts.b2Storage,
		}
	}
}

Boot(API)
