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
	static GLOBAL_USERS_ZSET = "presence:global_users"
	static USER_CONNECTIONS_PREFIX = "presence:user:"
	static SOCKETS_PREFIX = "presence:sockets:"
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

	async handleConnection({ socket_id, user_id }: ConnectionEventParams) {}

	async handleDisconnection({ socket_id, user_id }: ConnectionEventParams) {}

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
			UserConnections.GLOBAL_USERS_ZSET,
			offset,
			offset + limit - 1,
		)
	}

	async getUserIdConnections(userId: string | number) {
		if (!userId) {
			throw new OperationError(400, "missing redis or userId")
		}

		const userSetKey = `${UserConnections.USER_CONNECTIONS_PREFIX}${userId}`
		const socketIds = await this.redis.smembers(userSetKey)

		if (!socketIds || socketIds.length === 0) {
			return {}
		}

		const parsedConnections = {}
		const pipeline = this.redis.pipeline()

		for (const socketId of socketIds) {
			pipeline.hgetall(`${UserConnections.SOCKETS_PREFIX}${socketId}`)
		}

		const results = await pipeline.exec()

		socketIds.forEach((socketId, index) => {
			const res = results[index]
			if (res[0] === null && res[1]) {
				parsedConnections[socketId] = res[1]
			} else {
				parsedConnections[socketId] = { error: "invalid data" }
			}
		})

		return parsedConnections
	}

	async isUserConnected(userId: string | number): Promise<UserConn> {
		if (!userId) {
			throw new OperationError(400, "missing redis or userId")
		}

		const userSetKey = `${UserConnections.USER_CONNECTIONS_PREFIX}${userId}`
		const connectionsCount = await this.redis.scard(userSetKey)

		return {
			userId: userId,
			connected: connectionsCount > 0,
			connectionsCount: connectionsCount,
		}
	}

	async isUsersConnected(userIds: string[] | number[]): Promise<UserConn[]> {
		if (!userIds || !Array.isArray(userIds)) {
			throw new OperationError(400, "userIds must be an array")
		}

		if (userIds.length === 0) {
			return []
		}

		const pipeline = this.redis.pipeline()

		for (const userId of userIds) {
			pipeline.scard(
				`${UserConnections.USER_CONNECTIONS_PREFIX}${userId}`,
			)
		}

		const results = await pipeline.exec()

		return results.map((result, index) => {
			const count = result[1] as number
			return {
				userId: userIds[index],
				connected: count > 0,
				connectionsCount: count,
			}
		})
	}

	async getTotalConnectedUsers() {
		return this.redis.zcard(UserConnections.GLOBAL_USERS_ZSET)
	}
}
