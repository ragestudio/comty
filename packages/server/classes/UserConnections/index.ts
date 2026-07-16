import type Redis from "ioredis"
import type { Server } from "linebridge"

export type ConnectionEventParams = {
	socket_id: string
	user_id: string | number
}

export type QueryParams = {
	offset?: number
	limit?: number
}

export type UserConn = {
	userId: string | number
	connected: boolean
	connectionsCount?: number
}

export default class UserConnections {
	static CONNECTED_USERS_ZSET = "connected_users_zset"
	static USER_CONNECTIONS_PREFIX = "connections:user:"
	static fetchHardLimit = 200

	constructor(server: Server) {
		if (!server) {
			throw new Error("Server instance is required for UserConnections")
		}

		this.server = server
	}

	server: Server

	get redis(): Redis {
		if (!this.server.contexts.redis) {
			throw new Error(
				"server.contexts.redis | is required for UserConnections",
			)
		}

		return this.server.contexts.redis.client
	}

	//
	// Clear all orphaned connections for a given user, checking from the RTEngine instance
	//
	async clearUserIdOrphanedConnections(userId: string | number) {
		try {
			if (!userId) {
				return false
			}

			if (!this.server.engine || !this.server.engine.ws) {
				return false
			}

			const websocketClients = this.server.engine.ws.clients

			const connections = await this.getUserIdConnections(userId)

			const socketsIdToRemove = []

			for (const socketId of Object.keys(connections)) {
				if (websocketClients.has(socketId)) {
					continue
				}

				socketsIdToRemove.push(socketId)
			}

			// create a pipeline
			const pipeline = this.redis.pipeline()

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

	async handleConnection({ socket_id, user_id }: ConnectionEventParams) {
		if (!user_id || !socket_id) {
			return false
		}

		const userHashKey = `${UserConnections.USER_CONNECTIONS_PREFIX}${user_id}`

		const connectionData = {
			connectedAt: new Date().getTime(),
			socketId: socket_id,
		}

		const pipeline = this.redis.pipeline()

		pipeline.hset(userHashKey, socket_id, JSON.stringify(connectionData))
		pipeline.zadd(
			UserConnections.CONNECTED_USERS_ZSET,
			"NX",
			Date.now(),
			user_id,
		)

		await pipeline.exec()

		// clear orphaned connections after in the backgroud
		if (this.server.engine.ws) {
			setTimeout(() => {
				this.clearUserIdOrphanedConnections(user_id)
			}, 1000)
		}
	}

	async handleDisconnection({ socket_id, user_id }: ConnectionEventParams) {
		if (!user_id || !socket_id) {
			return false
		}

		const userHashKey = `${UserConnections.USER_CONNECTIONS_PREFIX}${user_id}`

		try {
			// delete the socket from the user hash
			await this.redis.hdel(userHashKey, socket_id)

			// if no more connections, remove the user from the zset
			const connectionsCount = await this.redis.hlen(userHashKey)

			if (connectionsCount === 0) {
				await this.redis.zrem(
					UserConnections.CONNECTED_USERS_ZSET,
					user_id,
				)
				await this.redis.del(userHashKey)
			}
		} catch (error) {
			console.error(
				`[USER_CONNECTIONS] Error while handling disconnection for user ${user_id}`,
				error,
			)
		}
	}

	async getAllConnectedUsers({ offset = 0, limit = 250 }: QueryParams = {}) {
		if (!this.redis) {
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

		return await this.redis.zrange(
			UserConnections.CONNECTED_USERS_ZSET,
			offset,
			offset + limit - 1,
		)
	}

	async getUserIdConnections(userId: string | number) {
		if (!userId) {
			throw new OperationError(400, "missing redis or userId")
		}

		const userHashKey = `${UserConnections.USER_CONNECTIONS_PREFIX}${userId}`

		const connections = await this.redis.hgetall(userHashKey)

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

	async isUserConnected(userId: string | number): Promise<UserConn> {
		if (!userId) {
			throw new OperationError(400, "missing redis or userId")
		}

		const userHashKey = `${UserConnections.USER_CONNECTIONS_PREFIX}${userId}`

		const connectionsCount = await this.redis.hlen(userHashKey)

		return {
			userId: userId,
			connected: connectionsCount > 0,
			connectionsCount: connectionsCount,
		}
	}

	async isUsersConnected(userIds: string[] | number[]): Promise<UserConn[]> {
		if (!userIds) {
			throw new OperationError(400, "missing redis or userIds")
		}

		if (!Array.isArray(userIds)) {
			throw new OperationError(400, "userIds must be an array")
		}

		if (userIds.length === 0) {
			return []
		}

		const pipeline = this.redis.pipeline()

		for (const userId of userIds) {
			pipeline.zscore(UserConnections.CONNECTED_USERS_ZSET, userId)
		}

		let results = await pipeline.exec()

		return results.map((result, index) => {
			return {
				userId: userIds[index],
				connected: !!result[1],
			}
		})
	}

	async getTotalConnectedUsers() {
		return this.redis.zcard(UserConnections.CONNECTED_USERS_ZSET)
	}
}
