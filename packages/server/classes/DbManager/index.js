import mongoose from "mongoose"

function getConnectionConfig(obj) {
	const {
		DB_USER,
		DB_DRIVER,
		DB_NAME,
		DB_PWD,
		DB_HOSTNAME,
		DB_PORT,
		DB_AUTH_SOURCE,
	} = obj

	const hasUsername = DB_USER !== undefined && DB_USER !== null && DB_USER !== ""
	const hasPassword = DB_PWD !== undefined && DB_PWD !== null && DB_PWD !== ""

	if (hasUsername !== hasPassword) {
		throw new Error(
			"MongoDB configuration requires both DB_USER and DB_PWD, or neither.",
		)
	}

	let auth = [DB_DRIVER ?? "mongodb", "://"]

	auth.push(DB_HOSTNAME ?? "localhost")
	auth.push(`:${DB_PORT ?? "27017"}`)

	auth = auth.join("")

	const params = {
		dbName: DB_NAME,
		maxPoolSize: 100,
	}

	if (hasUsername && hasPassword) {
		params.auth = {
			username: DB_USER,
			password: DB_PWD,
		}
	}

	if (hasUsername && DB_AUTH_SOURCE) {
		params.authSource = DB_AUTH_SOURCE
	}

	return [auth, params]
}

export default class DBManager {
	initialize = async (config) => {
		console.log(`🔌 Connecting to DB [${process.env.DB_HOSTNAME}]...`)

		const dbConfig = getConnectionConfig(config ?? process.env)

		mongoose.set("strictQuery", false)

		const connection = await mongoose.connect(...dbConfig).catch((err) => {
			console.log(`❌ Failed to connect to DB, retrying...\n`)
			console.log(err)

			return false
		})

		if (connection) {
			console.log(`✅ Connected to DB.`)
		}
	}
}
