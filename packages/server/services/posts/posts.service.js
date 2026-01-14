//import { Server } from "../../../../linebridge/server/src"
import { Server } from "linebridge"

import ScyllaDb from "@shared-classes/ScyllaDb"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import TaskQueueManager from "@shared-classes/TaskQueueManager"
import InjectedAuth from "@shared-lib/injectedAuth"

import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
	static refName = "posts"
	static listenPort = 3001

	static bypassCors = true
	static useMiddlewares = ["logs"]

	static websockets = {
		enabled: true,
		path: "/posts",
		nats: {
			enabled: true,
		},
	}

	middlewares = {
		...SharedMiddlewares,
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

	// handleWsConnection = (socket) => {
	// 	console.log(`[WS] @${socket.context.user.username} connected`)
	// }

	// handleWsDisconnect = (socket) => {
	// 	console.log(`[WS] @${socket.context.user.username} disconnected`)
	// }

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb()),
		redis: RedisClient(),
	}

	queuesManager = new TaskQueueManager({
		workersPath: `${__dirname}/queues`,
	})

	async onInitialize() {
		await this.contexts.db.initialize()
		await this.contexts.scylla.initialize()
		await this.contexts.redis.initialize()
		await this.queuesManager.initialize({
			redisOptions: this.contexts.redis.client.options,
		})

		global.queues = this.queuesManager
	}
}

Boot(API)
