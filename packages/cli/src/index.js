#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { Command } from "commander"
import { createClient } from "comty.js"
import SessionModel from "comty.js/dist/models/session/index.js"

import Cache from "./classes/cache.js"
import Config from "./classes/config.js"

import readCommandsFiles from "./utils/readCommandsFiles.js"
import importDefaults from "./utils/importDefaults.js"
import buildCommands from "./utils/buildCommands.js"
import authorizeAccount from "./utils/authorizeAccount.js"

const commandsPath = path.resolve(import.meta.dirname, "commands")
const packageJsonPath = path.resolve(import.meta.dirname, "../package.json")

// only for development
if (process.env.NODE_ENV === "development") {
	process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
}

async function main() {
	let packageJson = await fs.promises.readFile(packageJsonPath, "utf8")
	packageJson = JSON.parse(packageJson)

	global.config = new Config()
	global.comtyClient = createClient({
		origin:
			process.env.NODE_ENV === "production"
				? "https://api.comty.app"
				: "https://indev.comty.app/api",
	})

	await global.config.initialize()
	await Cache.initialize()

	if (!global.config.get("auth")) {
		console.log("No auth found, authentication required...")

		await authorizeAccount()
	}

	SessionModel.default.token = global.config.get("auth").token

	let program = new Command()

	program
		.name(packageJson.name)
		.description(packageJson.description)
		.version(packageJson.version)

	let commands = await readCommandsFiles(commandsPath)
	commands = await importDefaults(commands)
	program = await buildCommands(commands, program)

	program.parse()

	return 0
}

main()
