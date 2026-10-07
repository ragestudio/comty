import notifee, {
	AndroidColor,
	AndroidImportance,
	AndroidCategory,
	AndroidForegroundServiceType,
} from "react-native-notify-kit"
import { Platform, PermissionsAndroid } from "react-native"

const CALL_NOTIFICATION_ID = "webrtc_active_call"

notifee.registerForegroundService((notification) => {
	return new Promise(() => {})
})

let hasNotfOpened = false

export const startCallNotification = async () => {
	if (hasNotfOpened) return

	try {
		const permission = await notifee.requestPermission()

		if (permission.authorizationStatus === 0) {
			console.warn("Notificacion permission denied")
			return
		}

		if (Platform.OS === "android") {
			const granted = await PermissionsAndroid.requestMultiple([
				PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
				PermissionsAndroid.PERMISSIONS.CAMERA,
			])

			if (
				granted["android.permission.RECORD_AUDIO"] !==
				PermissionsAndroid.RESULTS.GRANTED
			) {
				console.warn(
					"It required mic permission to use in background mode",
				)
				return
			}
		}

		const channelId = await notifee.createChannel({
			id: "webrtc_calls",
			name: "RTC Channel Connection",
			importance: AndroidImportance.HIGH,
		})

		await notifee.displayNotification({
			id: CALL_NOTIFICATION_ID,
			title: "Connected to channel",
			body: "Currently connected to a Space Channel",
			android: {
				channelId,
				asForegroundService: true,
				category: AndroidCategory.CALL,
				smallIcon: "notification_icon",
				foregroundServiceTypes: [
					AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
					AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA,
				],
				color: AndroidColor.RED,
				ongoing: true,
				pressAction: {
					id: "default",
					launchActivity: "default",
				},
			},
		})

		hasNotfOpened = true
	} catch (error) {
		console.error("notf err:", error)
	}
}

export const stopCallNotification = async () => {
	if (!hasNotfOpened) return

	try {
		await notifee.stopForegroundService()

		await notifee.cancelNotification(CALL_NOTIFICATION_ID)

		hasNotfOpened = false
		console.log("notf deleted and service stopped")
	} catch (error) {
		console.error("notf close err:", error)
	}
}
