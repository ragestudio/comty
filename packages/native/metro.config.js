// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config")
const { withUniwindConfig } = require("uniwind/metro")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

config.serializer = {
	...config.serializer,
	getModulesRunBeforeMainModule: () => [
		require.resolve("@comty/shared/utils/index"),
	],
}

config.maxWorkers = 8

module.exports = withUniwindConfig(config, {
	cssEntryFile: "./src/global.css",
	dtsFile: "./uniwind-types.d.ts",
	extraThemes: ["moon-dark"],
})
