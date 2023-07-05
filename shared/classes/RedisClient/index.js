import { createClient } from "redis"
import { createAdapter } from "@socket.io/redis-adapter"

function composeURL() {
    // support for auth
    let url = "redis://"

    url += process.env.REDIS_HOST ?? "localhost"

    if (process.env.REDIS_PORT) {
        url += ":" + process.env.REDIS_PORT
    }

    return url
}

export default ({
    withWsAdapter = false
} = {}) => {
    let clientOpts = {
        url: composeURL(),
    }

    if (!process.env.REDIS_NO_AUTH) {
        if (process.env.REDIS_PASSWORD) {
            clientOpts.password = process.env.REDIS_PASSWORD
        }

        if (process.env.REDIS_USERNAME) {
            clientOpts.username = process.env.REDIS_USERNAME
        }
    }

    let client = createClient(clientOpts)

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