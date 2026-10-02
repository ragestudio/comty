import "../global.css"

import React from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { LucideProvider } from "lucide-react-native"
import { DarkTheme, ThemeProvider, Slot, useRouter } from "expo-router"
import { TamaguiProvider } from "tamagui"
import { PanelUIProvider, useTheme } from "panelui-native"
import { BottomSheet } from "@expo/ui"

import UI from "./tamagui.config"
import useApp from "@/engine/app"
import useMainSheetStore from "@/stores/MainSheet"
import TextureBg from "@/ui/TextureBg"

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
	const { theme, setTheme } = useTheme()

	// Initialize APP
	React.useEffect(() => {
		if (app && app?.ready === false) {
			app.initialize({
				router: router,
			})

			setTheme("dark")
		}
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
