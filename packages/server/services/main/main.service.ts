import { Server } from "linebridge"

import ScyllaDb from "@ragestudio/scylla-odm"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import UserConnections from "@shared-classes/UserConnections"
import resolveDbModelsPath from "@shared-utils/resolveDbModelsPath"

import SharedMiddlewares from "@shared-middlewares"

export class API extends Server {
	static refName = "main"
	static listenPort = 3000

	static bypassCors = true
	static useMiddlewares = ["logs"]

	static websockets = {
		enabled: true,
		path: "/main",
	}

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb({
			modelsPath: resolveDbModelsPath(),
		})),
		redis: RedisClient(),
		userConnections: new UserConnections(this),
	}

	initialize = [
		() => this.contexts.db.initialize(),
		() =>
			this.contexts.scylla.initialize({
				sync: true,
			}),
		() => this.contexts.redis.initialize(),
	]
}

export default API
