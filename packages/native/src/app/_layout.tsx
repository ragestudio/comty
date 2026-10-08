import "@comty/shared/utils/index"
import "@/app/adapter"
import "../global.css"

import { audioManager } from "@comty/spaces-sdk/rtc/audio"

import React from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { LucideProvider } from "lucide-react-native"
import { DarkTheme, ThemeProvider, Slot, useRouter } from "expo-router"
import { BottomSheet } from "@expo/ui"
import { TamaguiProvider, ZStack } from "tamagui"
import { PanelUIProvider, useTheme } from "panelui-native"
import TextureBg from "@/ui/TextureBg"
import { BlurTargetArea, BlurTargetProvider } from "@/ui/BlurTarget"
import ScreenFullscreen from "@/components/ScreenFullscreen"
import UI from "./tamagui.config"

import { app, useStore as useApp } from "@/engine/app"
import * as notifications from "@/engine/notifications"
import useMainSheetStore from "@/stores/MainSheet"
import { useRTCStore } from "@comty/spaces-sdk/rtc"
import { useAppPermissions } from "@/hooks/useAppPermissions"

import { GestureHandlerRootView } from "react-native-gesture-handler"

const RouterTheme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		background: "transparent",
	},
}

export const MainLayout = () => {
	const { hasAllPermissions, isChecking, requestPermissions } =
		useAppPermissions()
	// TODO: check if needs to open a main sheet to request permissions

	const appState = useApp()
	const router = useRouter()
	const sheet = useMainSheetStore()
	const rtc = useRTCStore()
	const pui = useTheme()

	const initialize = async () => {
		pui.setTheme("dark")

		await app.initialize({
			router: router,
		})
	}

	// Initialize APP
	React.useEffect(() => {
		if (appState?.ready === false) initialize()
	}, [app])

	React.useEffect(() => {
		if (rtc.state !== "disconnected") {
			notifications.startCallNotification().catch(console.error)
		} else {
			notifications.stopCallNotification().catch(console.error)
		}

		// hold the audio routing only while a call is running, releasing it lets the
		// headset go back to its normal profile when the call ends
		audioManager.setActive(rtc.state !== "disconnected").catch(console.error)

		if (rtc.state === "connected") {
			audioManager
				.refresh()
				.then(() => {
					const hasExternal = audioManager.outputs.some(
						(device) => device.type !== "speaker" && device.type !== "earpiece",
					)

					return audioManager.setSpeakerEnabled(!hasExternal)
				})
				.catch(console.error)
		}
	}, [rtc.state])

	// if (!isChecking && !hasAllPermissions) {
	// 	return (
	// 		<View>
	// 			<Button
	// 				title="Request needed permission"
	// 				onPress={requestPermissions}
	// 			/>
	// 		</View>
	// 	)
	// }

	if (!app.ready) return null

	return (
		<TamaguiProvider
			config={UI}
			defaultTheme={app.theme.currentKey}
		>
			<ThemeProvider value={RouterTheme}>
				<LucideProvider
					color={app.theme.currentTheme.color?.val}
					size={16}
				>
					<>
						<PanelUIProvider background={false}>
							<BlurTargetProvider>
								<ZStack style={{ flex: 1 }}>
									<SafeAreaView
										edges={["top", "left", "right"]}
										style={{
											flex: 1,
											backgroundColor: app.theme.currentTheme.background?.val,
										}}
									>
										<BlurTargetArea>
											<TextureBg
												overlayColor="$bgColor"
												noiseOpacity={0.2}
												blurIntensity={0}
											/>
											<Slot />
										</BlurTargetArea>
									</SafeAreaView>

									<ScreenFullscreen />
								</ZStack>
							</BlurTargetProvider>
						</PanelUIProvider>

						<BottomSheet
							isPresented={sheet.visible}
							onDismiss={() => sheet.handleOnDissmiss()}
							children={sheet.content}
							snapPoints={["half", "full"]}
							containerColor={app.theme.currentTheme?.bgAccentSolid?.val}
							contentColor={app.theme.currentTheme?.color?.val}
						/>
					</>
				</LucideProvider>
			</ThemeProvider>
		</TamaguiProvider>
	)
}

const Root = () => (
	<GestureHandlerRootView style={{ flex: 1 }}>
		<MainLayout />
	</GestureHandlerRootView>
)

export default Root
