import { Server } from "linebridge"

import DbManager from "@shared-classes/DbManager"
import CacheService from "@shared-classes/CacheService"
import StorageClient from "@shared-classes/StorageClient"

import SharedMiddlewares from "@shared-middlewares"

class API extends Server {
	static refName = "marketplace"
	static listenPort = process.env.HTTP_LISTEN_PORT ?? 3005

	static bypassCors = true
	static useMiddlewares = ["logs"]

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		cache: new CacheService({
			fsram: false,
		}),
		storage: StorageClient({
			endPoint: process.env.B2_ENDPOINT,
			cdnUrl: process.env.B2_CDN_ENDPOINT,
			defaultBucket: process.env.B2_BUCKET,
			accessKey: process.env.B2_KEY_ID,
			secretKey: process.env.B2_APP_KEY,
			port: 443,
			useSSL: true,
			setupBucket: false,
		}),
	}

	async onInitialize() {
		await this.contexts.db.initialize()
		await this.contexts.storage.initialize()

		global.cache = this.contexts.cache
		global.storages = {
			standard: this.contexts.storage,
		}
	}
}

Boot(API)
