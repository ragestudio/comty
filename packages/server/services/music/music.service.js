import { Server } from "linebridge"

import DbManager from "@shared-classes/DbManager"
import SSEManager from "@shared-classes/SSEManager"

import SharedMiddlewares from "@shared-middlewares"
import LimitsClass from "@shared-classes/Limits"

export default class API extends Server {
	static refName = "music"
	static enableWebsockets = true
	static routesPath = `${__dirname}/routes`
	static listen_port = process.env.HTTP_LISTEN_PORT ?? 3003

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		SSEManager: new SSEManager(),
	}

	async onInitialize() {
		global.sse = this.contexts.SSEManager

		await this.contexts.db.initialize()

		this.contexts.limits = await LimitsClass.get()
	}
}

Boot(API)
