import mongoose from "mongoose"

function getConnectionConfig(obj) {
    const { DB_USER, DB_DRIVER, DB_NAME, DB_PWD, DB_HOSTNAME, DB_PORT, DB_AUTH_SOURCE } = obj

    let auth = [
        DB_DRIVER ?? "mongodb",
        "://",
    ]

    if (DB_USER && DB_PWD) {
        auth.push(`${DB_USER}:${DB_PWD}@`)
    }

    auth.push(DB_HOSTNAME ?? "localhost")
    auth.push(`:${DB_PORT ?? "27017"}`)

    if (DB_USER) {
        auth.push("/?authMechanism=DEFAULT")
    }

    if (DB_AUTH_SOURCE && DB_USER) {
        auth.push(`&authSource=${DB_AUTH_SOURCE}`)
    }

    auth = auth.join("")

    return [
        auth,
        {
            dbName: DB_NAME,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    ]
}

export default class DBManager {
    initialize = async (config) => {
        console.log("🔌 Connecting to DB...")

        const dbConfig = getConnectionConfig(config ?? process.env)

        mongoose.set("strictQuery", false)

        const connection = await mongoose.connect(...dbConfig)
            .catch((err) => {
                console.log(`❌ Failed to connect to DB, retrying...\n`)
                console.log(error)

                // setTimeout(() => {
                //     this.initialize()
                // }, 1000)

                return false
            })

        if (connection) {
            console.log(`✅ Connected to DB.`)
        }
    }
}