import Server from "linebridge/src/server"

import ScyllaDb from "@shared-classes/ScyllaDb"
import DbManager from "@shared-classes/DbManager"
import CacheService from "@shared-classes/CacheService"
import StorageClient from "@shared-classes/StorageClient"

import SharedMiddlewares from "@shared-middlewares"

class API extends Server {
	static refName = "marketplace"
	static listenPort = 3005

	static bypassCors = true
	static useMiddlewares = ["logs"]

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb()),
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

	initialize = [
		() => this.contexts.db.initialize(),
		() => this.contexts.scylla.initialize(),
		() => this.contexts.storage.initialize(),
	]

	async onInitialize() {
		global.cache = this.contexts.cache
		global.storages = {
			standard: this.contexts.storage,
		}
	}
}

Boot(API)
