import { createRequire } from "node:module"

export interface PackageJson {
	name: string
	appName: string
	processName: string
	version: string
}

const require = createRequire(import.meta.url)

export const pkg = require("../../package.json") as PackageJson
