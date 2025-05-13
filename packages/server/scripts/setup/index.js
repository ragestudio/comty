import DbManager from "@shared-classes/DbManager"
import { Config } from "@db_models"

import fs from "node:fs/promises"
import path from "node:path"

const forceFlag = process.argv.includes("--force")

const tasksPath = path.resolve(__dirname, "./tasks")

async function main() {
	if (
		process.env.INFISICAL_CLIENT_ID &&
		process.env.INFISICAL_CLIENT_SECRET
	) {
		console.log(
			`[BOOT] INFISICAL Credentials found, injecting env variables from INFISICAL...`,
		)
		await global.injectEnvFromInfisical()
	}

	// create the context for tasks
	global.db = new DbManager()

	await global.db.initialize()

	let serverConfig = await Config.findOne({ key: "server" }).catch(() => {
		return false
	})

	if (serverConfig && serverConfig.value.setup === true && !forceFlag) {
		console.log(
			`Server is already setup (last run at ${serverConfig.value.updated_at}), skipping setup...\nUse --force to force setup.`,
		)
		return process.exit(0)
	}

	let tasks = await fs.readdir(tasksPath)

	// filter only files ends with .js
	tasks = tasks.filter((task) => task.endsWith(".js"))

	// sort by first numbers in file
	tasks = tasks.sort((a, b) => {
		const aNum = parseInt(a.split(".")[0])
		const bNum = parseInt(b.split(".")[0])

		return aNum - bNum
	})

	console.log(`Total (${tasks.length}) tasks...`)

	for await (const task of tasks) {
		const taskIndex = tasks.indexOf(task) + 1

		let taskObj = await import(path.resolve(tasksPath, task))

		taskObj = taskObj.default ?? taskObj

		if (typeof taskObj.fn !== "function") {
			console.log(`[ERROR] [${task}] has not a function, skipping...`)
			continue
		}

		try {
			console.log(
				`[INFO] Executing [${taskIndex}/${tasks.length}](${task})`,
			)

			if (taskObj.description) {
				console.log(`[INFO] ${taskObj.description}`)
			}

			await taskObj.fn()
		} catch (error) {
			console.log(`[ERROR] ${task} failed to execute`)
			console.log(error)

			if (taskObj.crashOnError === true) {
				console.log(`[ERROR] ${task} crashed, exiting...`)
				process.exit(1)
			}

			continue
		}

		console.log(`[SUCCESS] ${task} executed successfully`)
	}

	console.log("All tasks executed successfully!")

	if (serverConfig) {
		console.log("Updating server configuration document...")

		await Config.findOneAndUpdate(
			{ _id: serverConfig._id.toString() },
			{
				key: "server",
				value: {
					setup: true,
					updated_at: new Date(),
				},
			},
		)
	} else {
		console.log("Creating server configuration document...")

		await Config.create({
			key: "server",
			value: {
				setup: false,
			},
		})
	}

	process.exit(0)
}

main()
