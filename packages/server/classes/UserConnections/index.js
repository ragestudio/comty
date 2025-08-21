export default class UserConnections {
	constructor(server) {
		this.server = server

		if (!this.server) {
			throw new Error("Server instance is required for UserConnections")
		}
	}

	static CONNECTED_USERS_ZSET = "connected_users_zset"
	static USER_CONNECTIONS_PREFIX = "connections:user:"
	static fetchHardLimit = 200

	//
	// Clear all orphaned connections for a given user, checking from the RTEngine instance
	//
	async clearUserIdOrphanedConnections(redis, userId) {
		try {
			if (!redis || !userId) {
				return false
			}

			if (!this.server.engine || !this.server.engine.ws) {
				return false
			}

			const websocketClients = this.server.engine.ws.clients

			const connections = await UserConnections.getUserIdConnections(
				redis,
				userId,
			)

			const socketsIdToRemove = []

			for (const socketId of Object.keys(connections)) {
				if (websocketClients.has(socketId)) {
					continue
				}

				socketsIdToRemove.push(socketId)
			}

			// create a pipeline
			const pipeline = redis.pipeline()

			for (const socketId of socketsIdToRemove) {
				pipeline.hdel(
					UserConnections.USER_CONNECTIONS_PREFIX + userId,
					socketId,
				)
			}

			await pipeline.exec()

			console.debug(
				`[USER_CONNECTIONS] Cleared ${socketsIdToRemove.length} orphaned connections for user ${userId}`,
			)
		} catch (error) {
			console.error("Failed to clear orphaned connections", error)
		}
	}

	async handleConnection(redis, socket, user) {
		if (!user || !socket || !redis) {
			return false
		}

		const userId = user._id
		const socketId = socket.context.id

		const userHashKey = `${UserConnections.USER_CONNECTIONS_PREFIX}${userId}`

		const connectionData = {
			connectedAt: new Date().getTime(),
			socketId: socketId,
		}

		const pipeline = redis.pipeline()

		pipeline.hset(userHashKey, socketId, JSON.stringify(connectionData))
		pipeline.zadd(
			UserConnections.CONNECTED_USERS_ZSET,
			"NX",
			Date.now(),
			userId,
		)

		await pipeline.exec()

		// await redis.publish(`user:connected`, userId)

		console.log(`User ${userId} added to connected users set`)

		// clear orphaned connections after in the backgroud
		if (this.server.engine.ws) {
			setTimeout(() => {
				this.clearUserIdOrphanedConnections(redis, userId)
			}, 1000)
		}
	}

	async handleDisconnection(redis, socket, user) {
		if (!user || !socket || !redis) {
			return false
		}

		const userId = user._id
		const socketId = socket.context.id

		const userHashKey = `${UserConnections.USER_CONNECTIONS_PREFIX}${userId}`

		try {
			// delete the socket from the user hash
			await redis.hdel(userHashKey, socketId)

			// if no more connections, remove the user from the zset
			const connectionsCount = await redis.hlen(userHashKey)

			if (connectionsCount === 0) {
				await redis.zrem(UserConnections.CONNECTED_USERS_ZSET, userId)
				await redis.del(userHashKey)
			}
		} catch (error) {
			console.error(
				`[USER_CONNECTIONS] Error while handling disconnection for user ${userId}`,
				error,
			)
		}

		// await redis.publish(`user:disconnect`, userId)
	}

	static async getAllConnectedUsers(redis, { offset = 0, limit = 250 } = {}) {
		if (!redis) {
			throw new OperationError(400, "missing redis")
		}

		if (
			typeof limit !== "number" ||
			limit <= 0 ||
			typeof offset !== "number" ||
			offset < 0
		) {
			throw new OperationError(
				400,
				"limit and offset must be integers greater than 0.",
			)
		}

		if (limit > UserConnections.fetchHardLimit) {
			limit = UserConnections.fetchHardLimit
		}

		return await redis.zrange(
			UserConnections.CONNECTED_USERS_ZSET,
			offset,
			offset + limit - 1,
		)
	}

	static async getUserIdConnections(redis, userId) {
		if (!redis || !userId) {
			throw new OperationError(400, "missing redis or userId")
		}

		const userHashKey = `${UserConnections.USER_CONNECTIONS_PREFIX}${userId}`

		const connections = await redis.hgetall(userHashKey)

		const parsedConnections = {}

		for (const socketId in connections) {
			try {
				parsedConnections[socketId] = JSON.parse(connections[socketId])
			} catch (error) {
				parsedConnections[socketId] = {
					error: "invalid data",
				}
			}
		}

		return parsedConnections
	}

	static async isUserConnected(redis, userId) {
		if (!redis || !userId) {
			throw new OperationError(400, "missing redis or userId")
		}

		const userHashKey = `${UserConnections.USER_CONNECTIONS_PREFIX}${userId}`

		const connectionsCount = await redis.hlen(userHashKey)

		return {
			connected: connectionsCount > 0,
			connectionsCount: connectionsCount,
		}
	}

	static async isUsersConnected(redis, userIds) {
		if (!redis || !userIds) {
			throw new OperationError(400, "missing redis or userIds")
		}

		if (!Array.isArray(userIds)) {
			throw new OperationError(400, "userIds must be an array")
		}

		if (userIds.length === 0) {
			return {}
		}

		const pipeline = redis.pipeline()

		for (const userId of userIds) {
			pipeline.zscore(this.CONNECTED_USERS_ZSET, userId)
		}

		let results = await pipeline.exec()

		return results.map((result, index) => {
			return {
				user_id: userIds[index],
				connected: !!result[1],
			}
		})
	}

	static async getTotalConnectedUsers(redis) {
		return redis.zcard(UserConnections.CONNECTED_USERS_ZSET)
	}
}
