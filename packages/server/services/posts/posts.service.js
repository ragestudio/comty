//import { Server } from "../../../../linebridge/server/src"
import { Server } from "linebridge"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import TaskQueueManager from "@shared-classes/TaskQueueManager"
import InjectedAuth from "@shared-lib/injectedAuth"

import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
	static refName = "posts"
	static useEngine = "hyper-express-ng"
	static enableWebsockets = true

	static listen_port = process.env.HTTP_LISTEN_PORT ?? 3001

	middlewares = {
		...SharedMiddlewares,
	}

	handleWsUpgrade = async (context, token, res) => {
		if (!token) {
			return res.upgrade(context)
		}

		context = await InjectedAuth(context, token, res)

		if (!context.user) {
			res.close(401, "Unauthorized or missing auth token")
			return false
		}

		return res.upgrade(context)
	}

	// handleWsConnection = (socket) => {
	// 	console.log(`[WS] @${socket.context.user.username} connected`)
	// }

	// handleWsDisconnect = (socket) => {
	// 	console.log(`[WS] @${socket.context.user.username} disconnected`)
	// }

	contexts = {
		db: new DbManager(),
		redis: RedisClient(),
	}

	queuesManager = new TaskQueueManager({
		workersPath: `${__dirname}/queues`,
	})

	async onInitialize() {
		await this.contexts.db.initialize()
		await this.contexts.redis.initialize()
		await this.queuesManager.initialize({
			redisOptions: this.contexts.redis.client.options,
		})

		global.queues = this.queuesManager
	}
}

Boot(API)
