import { useState, useEffect } from "react"
import { Platform, PermissionsAndroid } from "react-native"
import notifee from "react-native-notify-kit"

export const useAppPermissions = () => {
	const [hasAllPermissions, setHasAllPermissions] = useState(false)
	const [isChecking, setIsChecking] = useState(true)

	const requestPermissions = async () => {
		setIsChecking(true)
		try {
			let allGranted = true

			const notifyStatus = await notifee.requestPermission()

			if (notifyStatus.authorizationStatus === 0) {
				allGranted = false
			}

			if (Platform.OS === "android") {
				const permissionsToAsk = [
					PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
					PermissionsAndroid.PERMISSIONS.CAMERA,
				]

				if (Platform.Version >= 33) {
					permissionsToAsk.push(
						PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
					)
				}

				const granted =
					await PermissionsAndroid.requestMultiple(permissionsToAsk)

				if (
					granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !==
						PermissionsAndroid.RESULTS.GRANTED ||
					granted[PermissionsAndroid.PERMISSIONS.CAMERA] !==
						PermissionsAndroid.RESULTS.GRANTED
				) {
					allGranted = false
				}
			}

			setHasAllPermissions(allGranted)
			return allGranted
		} catch (error) {
			console.error("Failed to apply permissions:", error)
			setHasAllPermissions(false)
			return false
		} finally {
			setIsChecking(false)
		}
	}

	useEffect(() => {
		requestPermissions()
	}, [])

	return { hasAllPermissions, isChecking, requestPermissions }
}
