import { Server } from "linebridge"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import TaskQueueManager from "@shared-classes/TaskQueueManager"

import SharedMiddlewares from "@shared-middlewares"

// wsfast
import HyperExpress from "hyper-express"

class WSFastServer {
	router = new HyperExpress.Router()

	clients = new Set()

	routes = {
		connect: async (socket) => {
			console.log("Client connected", socket)
		},
	}

	async initialize(engine) {
		this.engine = engine

		Object.keys(this.routes).forEach((route) => {
			this.router.ws(`/${route}`, this.routes[route])
		})

		this.engine.app.use(this.router)
	}
}

export default class API extends Server {
	static refName = "posts"
	static enableWebsockets = true
	static routesPath = `${__dirname}/routes`
	static wsRoutesPath = `${__dirname}/routes_ws`

	static listen_port = process.env.HTTP_LISTEN_PORT ?? 3001

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		redis: RedisClient(),
		ws: new WSFastServer(this.engine),
	}

	queuesManager = new TaskQueueManager(
		{
			workersPath: `${__dirname}/queues`,
		},
		this,
	)

	async onInitialize() {
		await this.contexts.db.initialize()
		await this.contexts.redis.initialize()
		await this.queuesManager.initialize({
			redisOptions: this.engine.ws.redis.options,
		})
		await this.contexts.ws.initialize(this.engine)

		global.queues = this.queuesManager
	}

	handleWsAuth = require("@shared-lib/handleWsAuth").default
}

Boot(API)
