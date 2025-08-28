import { Server } from "linebridge"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import StorageClient from "@shared-classes/StorageClient"
import CacheService from "@shared-classes/CacheService"
import SSEManager from "@shared-classes/SSEManager"
import LimitsClass from "@shared-classes/Limits"
import TaskQueueManager from "@shared-classes/TaskQueueManager"

import SharedMiddlewares from "@shared-middlewares"

class API extends Server {
	static refName = "files"
	static listenPort = process.env.HTTP_LISTEN_PORT ?? 3002

	static bypassCors = true
	static useMiddlewares = ["logs"]

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		cache: new CacheService(),
		SSEManager: new SSEManager(),
		redis: RedisClient({
			maxRetriesPerRequest: null,
		}),
		limits: {},
		storage: StorageClient(),
		b2Storage: null,
	}

	queuesManager = new TaskQueueManager(
		{
			workersPath: `${__dirname}/queues`,
		},
		this,
	)

	async onInitialize() {
		global.sse = this.contexts.SSEManager

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
		} else {
			console.warn(
				"B2 storage not configured on environment, skipping...",
			)
		}

		await this.contexts.redis.initialize()
		await this.queuesManager.initialize({
			redisOptions: this.contexts.redis.client,
		})
		await this.contexts.db.initialize()
		await this.contexts.storage.initialize()

		global.storages = {
			standard: this.contexts.storage,
			b2: this.contexts.b2Storage,
		}
		global.queues = this.queuesManager

		this.contexts.limits = await LimitsClass.get()
	}
}

Boot(API)
