import mongoose from "mongoose"

function getConnectionConfig(obj) {
    const { DB_USER, DB_DRIVER, DB_NAME, DB_PWD, DB_HOSTNAME, DB_PORT, DB_AUTH_SOURCE } = obj

    let auth = [
        DB_DRIVER ?? "mongodb",
        "://",
    ]

    auth.push(DB_HOSTNAME ?? "localhost")
    auth.push(`:${DB_PORT ?? "27017"}`)

    auth = auth.join("")

    const params = {
        auth: {},
        dbName: DB_NAME,
        user: DB_USER,
        pass: DB_PWD,
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }

    if (DB_AUTH_SOURCE) {
        params.auth.authSource = DB_AUTH_SOURCE
    }

    return [
        auth,
        params,
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
                console.log(err)

                return false
            })

        if (connection) {
            console.log(`✅ Connected to DB.`)
        }
    }
}