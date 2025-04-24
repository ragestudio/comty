import Redis from "ioredis"

export function composeURL({ host, port, username, password } = {}) {
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

export default (params = {}) => {
	let { REDIS_HOST, REDIS_PORT, REDIS_NO_AUTH, REDIS_AUTH, REDIS_DB } =
		process.env

	let clientOptions = {
		host: REDIS_HOST ?? "localhost",
		port: REDIS_PORT ?? 6379,
		lazyConnect: true,
		autoConnect: false,
		...params,
	}

	// if redis auth is provided, set username and password
	if (!ToBoolean(REDIS_NO_AUTH) && REDIS_AUTH) {
		const [user, password] = REDIS_AUTH.split(":")

		clientOptions.username = user
		clientOptions.password = password
	} else {
		console.log("⚠️ Redis auth is disabled")
	}

	// if redis db is provided, set db
	if (REDIS_DB) {
		clientOptions.db = REDIS_DB
	}

	let client = new Redis(clientOptions)

	client.on("error", (error) => {
		console.error("❌ Redis client error:", error)
	})

	client.on("connect", () => {
		console.log(`✅ Redis client connected [${process.env.REDIS_HOST}]`)
	})

	client.on("reconnecting", () => {
		console.log("🔄 Redis client reconnecting...")
	})

	const initialize = async () => {
		return await new Promise((resolve, reject) => {
			console.log(`🔌 Connecting to Redis client [${REDIS_HOST}]`)

			client.connect(resolve)
		})
	}

	return {
		client,
		initialize,
	}
}
