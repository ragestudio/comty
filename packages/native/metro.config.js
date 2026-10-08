// Learn more https://docs.expo.io/guides/customizing-metro
const path = require("path")
const fs = require("fs")
const JSON5 = require("json5")
const { getDefaultConfig } = require("expo/metro-config")
const { withUniwindConfig } = require("uniwind/metro")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

try {
	const forkRoot = fs.realpathSync(
		path.resolve(__dirname, "node_modules/@ragestudio/react-native-webrtc"),
	)
	const forkSrc = path.join(forkRoot, "src")

	if (fs.existsSync(forkSrc)) {
		config.watchFolders = [...(config.watchFolders ?? []), forkSrc]
	}
} catch {}

config.serializer = {
	...config.serializer,
	getModulesRunBeforeMainModule: () => [
		require.resolve("@comty/shared/utils/index"),
	],
}

config.maxWorkers = 8

// expo resolves tsconfig paths from the app root only, so workspace packages
// that use their own aliases (like @comty/spaces-sdk with "@/*") fail to resolve.
// this resolver reads the tsconfig nearest to the importing file and applies its
// paths before delegating to the default expo resolver.
const tsconfigCache = new Map()
const realpathCache = new Map()

function readPaths(dir) {
	if (tsconfigCache.has(dir)) return tsconfigCache.get(dir)

	const tsconfigPath = path.join(dir, "tsconfig.json")
	let result = null

	if (fs.existsSync(tsconfigPath)) {
		try {
			// tsconfig allows comments and trailing commas, so use a tolerant parser
			const raw = JSON5.parse(fs.readFileSync(tsconfigPath, "utf8"))
			const options = raw.compilerOptions || {}
			const paths = options.paths

			if (paths && Object.keys(paths).length > 0) {
				result = {
					baseDir: options.baseUrl
						? path.resolve(dir, options.baseUrl)
						: dir,
					paths,
				}
			}
		} catch {
			result = null
		}
	} else {
		const parent = path.dirname(dir)
		if (parent !== dir) result = readPaths(parent)
	}

	tsconfigCache.set(dir, result)
	return result
}

function realpath(filePath) {
	const cached = realpathCache.get(filePath)
	if (cached) return cached

	let resolved = filePath
	try {
		resolved = fs.realpathSync(filePath)
	} catch {}

	realpathCache.set(filePath, resolved)
	return resolved
}

// returns the wildcard value, an empty string for exact matches or null
function matchPattern(pattern, moduleName) {
	const starIndex = pattern.indexOf("*")

	if (starIndex === -1) return moduleName === pattern ? "" : null

	const prefix = pattern.slice(0, starIndex)
	const suffix = pattern.slice(starIndex + 1)

	if (
		moduleName.length >= prefix.length + suffix.length &&
		moduleName.startsWith(prefix) &&
		moduleName.endsWith(suffix)
	) {
		return moduleName.slice(
			prefix.length,
			moduleName.length - suffix.length,
		)
	}

	return null
}

function resolveAlias(context, moduleName, platform) {
	if (moduleName.startsWith(".") || path.isAbsolute(moduleName)) return null

	const origin = realpath(context.originModulePath)

	// third party packages ship their code already resolved
	if (origin.includes(`${path.sep}node_modules${path.sep}`)) return null

	const info = readPaths(path.dirname(origin))
	if (!info) return null

	for (const pattern of Object.keys(info.paths)) {
		const targets = info.paths[pattern]
		if (!Array.isArray(targets)) continue

		const star = matchPattern(pattern, moduleName)
		if (star === null) continue

		for (const target of targets) {
			if (typeof target !== "string") continue

			const candidate = path.resolve(
				info.baseDir,
				target.replace("*", star),
			)

			try {
				return context.resolveRequest(context, candidate, platform)
			} catch {
				// try the next mapping
			}
		}
	}

	return null
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
	const aliased = resolveAlias(context, moduleName, platform)
	if (aliased) return aliased

	return context.resolveRequest(context, moduleName, platform)
}

module.exports = withUniwindConfig(config, {
	cssEntryFile: "./src/global.css",
	dtsFile: "./uniwind-types.d.ts",
	extraThemes: ["moon-dark"],
})
