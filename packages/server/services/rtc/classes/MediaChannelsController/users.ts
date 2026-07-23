import { Redis } from "ioredis"

export class Users {
	readonly HASH_KEY = "global:user_channels"
	redis: Redis

	constructor(redis: Redis) {
		if (!redis) throw new Error("redis is required")
		this.redis = redis
	}

	async isInChannel(userId: string, channelId: string) {
		return (await this.get(userId)) === channelId
	}

	async get(userId: string) {
		const raw = await this.redis.hget(this.HASH_KEY, userId)
		if (!raw) return null

		return raw
	}

	async set(userId: string, channelId: string) {
		return await this.redis.hset(this.HASH_KEY, userId, channelId)
	}

	async remove(userId: string, channelId: string) {
		const isInChannel = await this.isInChannel(userId, channelId)
		if (!isInChannel) return

		return await this.redis.hdel(this.HASH_KEY, userId)
	}
}

export default Users
