import fs from "node:fs"
import path from "node:path"

import { ExpoConfig, ConfigContext } from "expo/config"

const fontFiles = fs
	.readdirSync(path.resolve(__dirname, "./assets/fonts"))
	.filter((file) => file.endsWith(".ttf"))
	.map((file) => `./assets/fonts/${file}`)

export default ({ config }: ConfigContext): ExpoConfig => ({
	...config,
	name: "Spaces",
	slug: "spaces",
	version: "1.0.0",
	orientation: "portrait",
	icon: "./assets/icon.png",
	scheme: "app",
	userInterfaceStyle: "dark",
	ios: {
		icon: "./assets/expo.icon",
		bundleIdentifier: "net.ragestudio.spaces",
	},
	android: {
		adaptiveIcon: {
			backgroundColor: "#E6F4FE",
			foregroundImage: "./assets/icon.png",
			backgroundImage: "./assets/icon.png",
			monochromeImage: "./assets/icon.png",
		},
		predictiveBackGestureEnabled: false,
		package: "net.ragestudio.spaces",
		permissions: [
			"android.permission.INTERNET",
			"android.permission.CAMERA",
			"android.permission.RECORD_AUDIO",
			"android.permission.ACCESS_NETWORK_STATE",
			"android.permission.CHANGE_NETWORK_STATE",
			"android.permission.MODIFY_AUDIO_SETTINGS",
			"android.permission.BLUETOOTH",
			"android.permission.BLUETOOTH_ADMIN",
			"android.permission.BLUETOOTH_CONNECT",
			"android.permission.FOREGROUND_SERVICE",
			"android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION",
		],
	},
	web: {
		output: "single",
		favicon: "./assets/icon.png",
	},
	plugins: [
		"expo-router",
		[
			"expo-splash-screen",
			{
				backgroundColor: "#1c1c1c",
				image: "./assets/icon.png",
				imageWidth: 125,
			},
		],
		[
			"expo-font",
			{
				fonts: fontFiles,
			},
		],
		[
			"expo-secure-store",
			{
				configureAndroidBackup: true,
				faceIDPermission:
					"Allow $(PRODUCT_NAME) to access your Face ID biometric data.",
			},
		],
		[
			"expo-build-properties",
			{
				android: {
					compileSdkVersion: 36,
					targetSdkVersion: 36,
					buildToolsVersion: "36.0.0",
					buildArchs: ["arm64-v8a"],
				},
			},
		],
	],
	experiments: {
		typedRoutes: true,
		reactCompiler: true,
	},
})
