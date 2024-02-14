import Redis from "ioredis"

function composeURL({
    host,
    port,
    username,
    password,
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

export default () => {
    let { REDIS_HOST, REDIS_PORT, REDIS_NO_AUTH, REDIS_AUTH, REDIS_DB } = process.env

    REDIS_NO_AUTH = ToBoolean(REDIS_NO_AUTH)

    let clientOptions = {
        host: REDIS_HOST,
        port: REDIS_PORT,
        lazyConnect: true,
        autoConnect: false
    }

    if (!REDIS_NO_AUTH) {
        if (REDIS_AUTH) {
            const [user, password] = REDIS_AUTH.split(":")

            clientOptions.username = user
            clientOptions.password = password
        }
    } else {
        console.log("⚠️ Redis auth is disabled")
    }

    if (REDIS_DB) {
        clientOptions.db = REDIS_DB
    }

    clientOptions = composeURL(clientOptions)

    let client = {}

    client.initialize = async () => {
        console.log(`🔌 Connecting to Redis client [${REDIS_HOST}]`)

        client = new Redis(clientOptions)

        client.on("error", (error) => {
            console.error("❌ Redis client error:", error)
        })

        client.on("connect", () => {
            console.log(`✅ Redis client connected [${process.env.REDIS_HOST}]`)
        })

        client.on("reconnecting", () => {
            console.log("🔄 Redis client reconnecting...")
        })

        return client
    }

    return client
}