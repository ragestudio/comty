import { Server } from "linebridge"
import DbManager from "@shared-classes/DbManager"

import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
	static refName = "main"
	static useEngine = "hyper-express-ng"
	static routesPath = `${__dirname}/routes`
	static listen_port = process.env.HTTP_LISTEN_PORT || 3000
	static enableWebsockets = false

	middlewares = {
		...require("@middlewares").default,
		...SharedMiddlewares,
	}

	events = require("./events")

	contexts = {
		db: new DbManager(),
	}

	async onInitialize() {
		await this.contexts.db.initialize()
	}
}

Boot(API)
