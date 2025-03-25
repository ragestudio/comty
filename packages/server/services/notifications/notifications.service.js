import { Server } from "linebridge"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"

import SharedMiddlewares from "@shared-middlewares"

class API extends Server {
	static refName = "notifications"
	static enableWebsockets = true
	static wsRoutesPath = `${__dirname}/ws_routes`
	static routesPath = `${__dirname}/routes`
	static listen_port = process.env.HTTP_LISTEN_PORT ?? 3009

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		redis: RedisClient(),
	}

	async onInitialize() {
		await this.contexts.db.initialize()
		await this.contexts.redis.initialize()
	}

	handleWsAuth = require("@shared-lib/handleWsAuth").default
}

Boot(API)
