//import { Server } from "../../../../linebridge/server/src"
import { Server } from "linebridge"

import { Worker as SnowflakeWorker } from "snowflake-uuid"

import DbManager from "@shared-classes/DbManager"
import ScyllaDb from "@shared-classes/ScyllaDb"
import RedisClient from "@shared-classes/RedisClient"
import InjectedAuth from "@shared-lib/injectedAuth"
import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
	static refName = "groups"
	static listenPort = process.env.HTTP_LISTEN_PORT ?? 3012

	static useMiddlewares = ["logs"]
	static bypassCors = true

	static websockets = {
		enabled: true,
		path: "/groups",
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

	handleWsConnection = (socket) => {
		if (socket.context.user) {
			console.log(`[WS] @${socket.context.user.username} connected`)
		}
	}

	handleWsDisconnect = async (socket) => {
		if (socket.context.user) {
			console.log(`[WS] @${socket.context.user.username} disconnected`)
		}
	}

	contexts = {
		db: new DbManager(),
		redis: RedisClient(),
		scylla: (global.scylla = new ScyllaDb({
			contactPoints: ["172.17.0.2"],
			localDataCenter: "datacenter1",
			keyspace: "comty",
		})),
		snowflake: (global.snowflake = new SnowflakeWorker(0, 1)),
	}

	async onInitialize() {
		await this.contexts.db.initialize()
		await this.contexts.redis.initialize()
		await this.contexts.scylla.initialize()
	}
}

Boot(API)
