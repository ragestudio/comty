import path from "node:path"
import ScyllaDb from "@ragestudio/scylla-odm"

import EnvLoad from "@linebridge/cli/libs/env.mjs"
import InfisicalLib from "@linebridge/cli/libs/infisical.mjs"

const dbModelsPath = path.resolve(process.cwd(), "../shared/db")

async function main() {
	EnvLoad()
	await InfisicalLib.LoadFromEnv()

	const db = new ScyllaDb({
		contactPoints: process.env.SCYLLA_CONTACT_POINTS?.split(","),
		keyspace: process.env.SCYLLA_KEYSPACE,
		localDataCenter: process.env.SCYLLA_LOCAL_DATA_CENTER,
		modelsPath: dbModelsPath,
	})

	await db.initialize({
		sync: true,
	})

	console.log("Sync done")
	process.exit(0)
}

main()
