import { createClient } from "redis"

function composeURL() {
    // support for auth
    let url = "redis://"

    if (process.env.REDIS_PASSWORD && process.env.REDIS_USERNAME) {
        url += process.env.REDIS_USERNAME + ":" + process.env.REDIS_PASSWORD + "@"
    }

    url += process.env.REDIS_HOST ?? "localhost"

    if (process.env.REDIS_PORT) {
        url += ":" + process.env.REDIS_PORT
    }

    return url
}

export default () => {
    let client = createClient({
        url: composeURL(),
    })

    client.initialize = async () => {
        console.log("🔌 Connecting to Redis client...")

        await client.connect()

        return client
    }

    // handle when client disconnects unexpectedly to avoid main crash
    client.on("error", (error) => {
        console.error("❌ Redis client error:", error)
    })

    // handle when client connects
    client.on("connect", () => {
        console.log("✅ Redis client connected.")
    })

    return client
}