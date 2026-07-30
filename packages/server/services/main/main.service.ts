import { Server } from "linebridge"
import path from "path"

import ScyllaDb from "@ragestudio/scylla-odm"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import UserConnections from "@shared-classes/UserConnections"

import SharedMiddlewares from "@shared-middlewares"

import type { RtEngineContext } from "linebridge/dist/classes/RtEngine/types"

export default class API extends Server {
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
			modelsPath: path.resolve(global["paths"].root, "../shared/db"),
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

Boot(API)
