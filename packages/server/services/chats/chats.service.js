//import { Server } from "linebridge"
import { Server } from "../../../../linebridge/server/src"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import InjectedAuth from "@shared-lib/injectedAuth"
import ScyllaDb from "@shared-classes/ScyllaDb"
import ChatChannelsController from "@classes/ChatChannelsController"
import { Worker as SnowflakeWorker } from "snowflake-uuid"

import SharedMiddlewares from "@shared-middlewares"

class API extends Server {
	static refName = "chats"
	static listenPort = process.env.HTTP_LISTEN_PORT ?? 3004

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
		redis: RedisClient(),
		chatChannelsController: new ChatChannelsController(this),
		scylla: new ScyllaDb({
			contactPoints: ["172.17.0.2"],
			localDataCenter: "datacenter1",
			keyspace: "comty",
		}),
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
