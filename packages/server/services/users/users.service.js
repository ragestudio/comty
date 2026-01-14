import { Server } from "linebridge"

import ScyllaDb from "@shared-classes/ScyllaDb"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"

import SharedMiddlewares from "@shared-middlewares"
import InjectedAuth from "@shared-lib/injectedAuth"

export default class API extends Server {
	static refName = "users"
	static routesPath = `${__dirname}/routes`
	static listenPort = 3008

	static bypassCors = true
	static useMiddlewares = ["logs"]

	static websockets = {
		enabled: true,
		path: "/users",
	}

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb()),
		redis: RedisClient(),
	}

	handleWsUpgrade = async (context, token, res) => {
		if (!token) {
			return res.upgrade(context)
		}

		context = await InjectedAuth(context, token, res).catch(() => {
			res.close(401, "Failed to verify auth token")
			return false
		})

		if (!context || !context.user) {
			res.close(401, "Unauthorized or missing auth token")
			return false
		}

		return res.upgrade(context)
	}

	async onInitialize() {
		await this.contexts.db.initialize()
		await this.contexts.redis.initialize()
		await this.contexts.scylla.initialize()
	}
}

Boot(API)
