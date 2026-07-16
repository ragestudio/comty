import path from "node:path"
import ScyllaDb from "@ragestudio/scylla-odm"
import InfisicalLib from "linebridge/bootloader/libs/infisical.js"

const dbModelsPath = path.resolve(global["paths"].root, "../shared/db")

async function main() {
	await InfisicalLib.LoadFromEnv()

	const db = new ScyllaDb({
		modelsPath: dbModelsPath,
	})
	await db.initialize({
		sync: true,
	})

	console.log("Sync done")
	process.exit(0)
}

main()
