import "@comty/shared/utils/index"

import { registerGlobals as registerRtcGlobals } from "react-native-webrtc"
registerRtcGlobals()

import "../global.css"

import React from "react"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { LucideProvider } from "lucide-react-native"
import { DarkTheme, ThemeProvider, Slot, useRouter } from "expo-router"
import { BottomSheet } from "@expo/ui"
import { TamaguiProvider, YStack, ZStack } from "tamagui"
import { PanelUIProvider, useTheme } from "panelui-native"
import TextureBg from "@/ui/TextureBg"
import UI from "./tamagui.config"

import { app, useStore as useApp } from "@/engine/app"
import useMainSheetStore from "@/stores/MainSheet"
import { rtcService, useRTCStore } from "@/lib/spaces/stores/rtc"
import RTCControls from "@/components/RTCControls"

const RouterTheme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		background: "transparent",
	},
}

export const MainLayout = () => {
	const appState = useApp()
	const router = useRouter()
	const sheet = useMainSheetStore()
	const rtc = useRTCStore()
	const pui = useTheme()

	const insets = useSafeAreaInsets()

	const initialize = async () => {
		pui.setTheme("dark")

		await app.initialize({
			router: router,
		})

		await rtcService.initialize()
	}

	// Initialize APP
	React.useEffect(() => {
		if (appState?.ready === false) initialize()
	}, [app])

	React.useEffect(() => {
		rtcService.bind(
			() => app.socket,
			() => app.userData?._id,
		)
	}, [rtc])

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
							<ZStack style={{ flex: 1 }}>
								{rtc.state !== "disconnected" && (
									<YStack
										position="absolute"
										style={{
											bottom: insets.bottom + 65,
											zIndex: 1,
											width: "100%",
											padding: 10,
										}}
									>
										<RTCControls />
									</YStack>
								)}

								<SafeAreaView
									edges={["top", "left", "right"]}
									style={{
										flex: 1,
										backgroundColor: app.theme.currentTheme.background?.val,
									}}
								>
									<TextureBg
										overlayColor="$bgColor"
										noiseOpacity={0.2}
										blurIntensity={0}
									/>
									<Slot />
								</SafeAreaView>
							</ZStack>
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

export default MainLayout
