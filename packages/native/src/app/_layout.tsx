import { registerGlobals } from "react-native-webrtc"
registerGlobals()

import "../global.css"

import React from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { LucideProvider } from "lucide-react-native"
import { DarkTheme, ThemeProvider, Slot, useRouter } from "expo-router"
import { BottomSheet } from "@expo/ui"
import { TamaguiProvider } from "tamagui"
import { PanelUIProvider, useTheme } from "panelui-native"
import TextureBg from "@/ui/TextureBg"
import UI from "./tamagui.config"

import useApp from "@/engine/app"
import useMainSheetStore from "@/stores/MainSheet"
import useRtc, { rtcService } from "@/lib/spaces/stores/rtc"

import { AudioContext } from "react-native-audio-api"

const RouterTheme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		background: "transparent",
	},
}

export const MainLayout = () => {
	const router = useRouter()
	const app = useApp()
	const sheet = useMainSheetStore()
	const rtc = useRtc()
	const pui = useTheme()

	const initialize = async () => {
		pui.setTheme("dark")

		await app.initialize({
			router: router,
		})

		await rtcService.initialize()
	}

	// Initialize APP
	React.useEffect(() => {
		if (app && app?.ready === false) initialize()
	}, [app])

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
						<PanelUIProvider>
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
