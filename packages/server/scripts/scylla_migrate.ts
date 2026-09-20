import InfisicalLib from "linebridge/bootloader/libs/infisical.js"

import ScyllaDb from "@ragestudio/scylla-odm/index"
import resolveDbModelsPath from "../utils/resolveDbModelsPath"

async function main() {
	await InfisicalLib.LoadFromEnv()

	const db = new ScyllaDb({
		modelsPath: resolveDbModelsPath(),
	})

	await db.initialize({
		sync: true,
	})

	await db.migrate()

	console.log("Migration done")
	process.exit(0)
}

main()
