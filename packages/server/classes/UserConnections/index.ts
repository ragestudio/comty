import type Redis from "ioredis"
import type { UserPresenceConnection } from "@comty/shared/types/user"
import type { Server } from "linebridge"

/** current unix time in seconds, the presence zset stores expiry scores */
function now(): number {
	return Math.floor(Date.now() / 1000)
}

export type ConnectionEventParams = {
	socket_id: string
	user_id: string | number
}

export type QueryParams = {
	offset?: number
	limit?: number
}

export default class UserConnections {
	static GLOBAL_USERS_ZSET = "presence:global_users"
	static USER_CONNECTIONS_PREFIX = "presence:user:"
	static SOCKETS_PREFIX = "presence:sockets:"
	static fetchHardLimit = 200

	/**
	 * Counts the sockets of a user that still hold a live presence hash.
	 * Stale members left behind by an instance that died are removed here,
	 * so a presence read never reports a connection that no longer exists.
	 */
	static liveConnectionsScript = `
		local members = redis.call('SMEMBERS', KEYS[1])
		local count = 0
		for i = 1, #members do
			if redis.call('EXISTS', ARGV[1] .. members[i]) == 1 then
				count = count + 1
			else
				redis.call('SREM', KEYS[1], members[i])
			end
		end
		return count
	`

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

		return await this.redis.zrangebyscore(
			UserConnections.GLOBAL_USERS_ZSET,
			`(${now()}`,
			"+inf",
			"LIMIT",
			offset,
			limit,
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
			const data = res && res[0] === null ? res[1] : null

			// a missing hash belongs to a dead connection, drop it
			if (!data || Object.keys(data).length === 0) {
				this.redis.srem(userSetKey, socketId).catch(() => {})
				return
			}

			parsedConnections[socketId] = data
		})

		return parsedConnections
	}

	async isUserConnected(
		userId: string | number,
	): Promise<UserPresenceConnection> {
		if (!userId) {
			throw new OperationError(400, "missing redis or userId")
		}

		const userSetKey = `${UserConnections.USER_CONNECTIONS_PREFIX}${userId}`
		const connectionsCount = (await this.redis.eval(
			UserConnections.liveConnectionsScript,
			1,
			userSetKey,
			UserConnections.SOCKETS_PREFIX,
		)) as number

		return {
			userId: userId,
			connected: connectionsCount > 0,
			connectionsCount: connectionsCount,
		}
	}

	async isUsersConnected(
		userIds: string[] | number[],
	): Promise<UserPresenceConnection[]> {
		if (!userIds || !Array.isArray(userIds)) {
			throw new OperationError(400, "userIds must be an array")
		}

		if (userIds.length === 0) {
			return []
		}

		const pipeline = this.redis.pipeline()

		for (const userId of userIds) {
			pipeline.eval(
				UserConnections.liveConnectionsScript,
				1,
				`${UserConnections.USER_CONNECTIONS_PREFIX}${userId}`,
				UserConnections.SOCKETS_PREFIX,
			)
		}

		const results = await pipeline.exec()

		return results.map((result, index) => {
			const count = result ? Number(result[1]) || 0 : 0
			return {
				userId: userIds[index],
				connected: count > 0,
				connectionsCount: count,
			}
		})
	}

	async getTotalConnectedUsers() {
		return this.redis.zcount(
			UserConnections.GLOBAL_USERS_ZSET,
			`(${now()}`,
			"+inf",
		)
	}
}
