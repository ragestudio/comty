import { Server } from "linebridge"
import DbManager from "@shared-classes/DbManager"
import TaskQueueManager from "@shared-classes/TaskQueueManager"
import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
	static refName = "auth"
	static useEngine = "hyper-express"
	static routesPath = `${__dirname}/routes`
	static listen_port = process.env.HTTP_LISTEN_PORT ?? 3020
	static enableWebsockets = true

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
	}

	queuesManager = new TaskQueueManager(
		{
			workersPath: `${__dirname}/queues`,
		},
		this,
	)

	async onInitialize() {
		await this.contexts.db.initialize()
		await this.queuesManager.initialize({
			redisOptions: this.engine.ws.redis.options,
		})
		global.queues = this.queuesManager
	}

	onExit() {
		this.queuesManager.cleanUp()
	}
}

Boot(API)
