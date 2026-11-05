import Redis, { RedisOptions } from "ioredis"

export function composeURL({
	host,
	port,
	username,
	password,
}: {
	host?: string
	port?: string
	username?: string
	password?: string
} = {}) {
	let url = "redis://"

	if (username && password) {
		url += username + ":" + password + "@"
	}

	url += host ?? "localhost"

	if (port) {
		url += ":" + port
	}

	return url
}

export default (params: RedisOptions = {}) => {
	let {
		REDIS_HOST,
		REDIS_PORT,
		REDIS_NO_AUTH,
		REDIS_AUTH,
		REDIS_DB,
		REDIS_URL,
	} = process.env

	// autoConnect is a valid ioredis option but missing from its typings
	let clientOptions = {
		lazyConnect: true,
		autoConnect: false,
		...params,
	}

	// REDIS_URL wins over the individual variables and the gateway config
	const connectionUrl = REDIS_URL?.trim()

	if (!connectionUrl) {
		clientOptions.host = REDIS_HOST ?? "localhost"
		clientOptions.port = Number.parseInt(REDIS_PORT ?? "6379", 10)

		// if redis auth is provided, use username and password
		if (!ToBoolean(REDIS_NO_AUTH) && REDIS_AUTH) {
			const [user, password] = REDIS_AUTH.split(":")

			clientOptions.username = user
			clientOptions.password = password
		} else {
			console.log("⚠️ Redis auth is disabled")
		}

		// if redis db is provided, set db
		if (REDIS_DB) {
			clientOptions.db = parseInt(REDIS_DB)
		}
	}

	let client = connectionUrl
		? new Redis(connectionUrl, clientOptions)
		: new Redis(clientOptions)

	client.on("error", (error) => {
		console.error("❌ Redis client error:", error)
	})

	client.on("connect", () => {
		console.log(
			`✅ Redis client connected [${connectionUrl ?? REDIS_HOST}]`,
		)
	})

	client.on("reconnecting", () => {
		console.log("🔄 Redis client reconnecting...")
	})

	const initialize = async () => {
		return await new Promise((resolve, reject) => {
			console.log(
				`🔌 Connecting to Redis client [${connectionUrl ?? REDIS_HOST}]`,
			)

			client.connect(resolve)
		})
	}

	return {
		client,
		initialize,
	}
}
