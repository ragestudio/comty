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
	version: "0.3.0",
	orientation: "portrait",
	icon: "./assets/icon.png",
	scheme: "app",
	userInterfaceStyle: "dark",
	android: {
		adaptiveIcon: {
			backgroundColor: "#1c1c1c",
			foregroundImage:
				"./assets/android/res/mipmap-xxxhdpi/ic_launcher_foreground.png",
			backgroundImage:
				"./assets/android/res/mipmap-xxxhdpi/ic_launcher_background.png",
			monochromeImage:
				"./assets/android/res/mipmap-xxxhdpi/ic_launcher_monochrome.png",
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
			"android.permission.FOREGROUND_SERVICE_MICROPHONE",
			"android.permission.FOREGROUND_SERVICE_CAMERA",
			"android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION",
			"android.permission.POST_NOTIFICATIONS",
		],
	},

	ios: {
		icon: "./assets/icon.png",
		bundleIdentifier: "net.ragestudio.spaces",
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
				image: "./assets/android/play_store_512.png",
				imageWidth: 225,
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
		[
			"@config-plugins/react-native-webrtc",
			{
				cameraPermission: "Allow access to your camera",
				microphonePermission: "Allow access to your microphone",
			},
		],
		[
			"react-native-notify-kit",
			{
				android: {
					foregroundService: {
						types: ["microphone", "camera"],
					},
				},
			},
		],
	],
	experiments: {
		typedRoutes: true,
		reactCompiler: true,
	},
})
