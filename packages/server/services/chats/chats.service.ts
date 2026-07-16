import { Server } from "linebridge"
import { Worker as SnowflakeWorker } from "@shared-classes/Snowflake"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import ScyllaDb from "@ragestudio/scylla-odm"

import SharedMiddlewares from "@shared-middlewares"

import GroupChatChannelController from "@classes/GroupChatChannelController"
import DMChatChannelController from "@classes/DMChatChannelController"

export default class API extends Server {
	static refName = "chats"
	static listenPort = 3004
	static routesPath = __dirname + "/routes"

	static useMiddlewares = ["logs"]
	static bypassCors = true

	static websockets = {
		enabled: true,
		path: "/chats",
	}

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb({
			modelsPath: global["paths"].root + "/db",
		})),
		redis: RedisClient(),
		groupChannels: new GroupChatChannelController(this),
		dmChannels: new DMChatChannelController(this),
		// TODO: add linebridge cluster worker & datacenter id
		snowflake: new SnowflakeWorker(0, 1),
	}

	async onInitialize(): Promise<void> {
		if (!this.engine.ws) {
			throw new Error(`Websocket not enabled!`)
		}

		await this.contexts.db.initialize()
		await this.contexts.redis.initialize()
		await this.contexts.scylla.initialize({
			sync: true,
		})
	}
}

Boot(API)
