import { createClient } from "redis"
import { createAdapter } from "@socket.io/redis-adapter"

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

export default ({
    withWsAdapter = false
} = {}) => {
    let client = createClient({
        url: composeURL(),
        password: process.env.REDIS_PASSWORD,
        username: process.env.REDIS_USERNAME,
    })

    if (withWsAdapter) {
        client.subClient = client.duplicate()
        client.ioAdapter = global.ioAdapter = createAdapter(client, client.subClient)
    }

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