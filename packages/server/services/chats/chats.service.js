//import { Server } from "../../../../linebridge/server/src"
import { Server } from "linebridge"
import { Worker as SnowflakeWorker } from "snowflake-uuid"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import InjectedAuth from "@shared-lib/injectedAuth"
import ScyllaDb from "@shared-classes/ScyllaDb"

import SharedMiddlewares from "@shared-middlewares"

import GroupChatChannelController from "@classes/GroupChatChannelController"
import DMChatChannelController from "@classes/DMChatChannelController"

class API extends Server {
	static refName = "chats"
	static listenPort = 3004
	static routesPath = __dirname + "/routes"

	static useMiddlewares = ["logs"]
	static bypassCors = true

	static websockets = {
		enabled: true,
		path: "/chats",
		nats: {
			enabled: true,
		},
	}

	middlewares = {
		...SharedMiddlewares,
	}

	contexts = {
		db: new DbManager(),
		scylla: (global.scylla = new ScyllaDb()),
		redis: RedisClient(),
		groupChannels: new GroupChatChannelController(this),
		dmChannels: new DMChatChannelController(this),
		// TODO: add linebridge cluster worker & datacenter id
		snowflake: new SnowflakeWorker(0, 1),
	}

	handleWsUpgrade = async (context, token, res) => {
		if (!token) {
			return res.status(401).json({ error: "Missing auth token" })
		}

		context = await InjectedAuth(context, token, res).catch(() => {
			res.status(401).json({ error: "Failed to verify auth token" })
			return false
		})

		if (!context || !context.user) {
			res.status(401).json({
				error: "Invalid auth token",
			})
			return false
		}

		return res.upgrade(context)
	}

	async onInitialize() {
		if (!this.engine.ws) {
			throw new Error(`Engine WS not found!`)
		}

		await this.contexts.db.initialize()
		await this.contexts.redis.initialize()
		await this.contexts.scylla.initialize()
	}
}

Boot(API)
