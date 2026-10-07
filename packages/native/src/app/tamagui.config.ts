import { defaultConfig } from "@tamagui/config/v5"
import { createFont, createTamagui } from "tamagui"

export const BaseColors = {
	productColor: "#C8FF00",
	productColorAccent: "#CFFF74",
}

export const DarkColors = {
	textColor: "#d8d8d8",
	textColorContrast: "#000000",

	bgPrimary: "#1c1c1ccc",
	bgPrimarySolid: "#1c1c1c",

	bgAccent: "#2a2a2acc",
	bgAccentSolid: "#2a2a2a",

	borderColor: "#ffffff33",
	borderColorSolid: "#ffffff",

	disabledContrastColor: "#ff0054",

	colorError: "#E45525",
}

export const config = createTamagui({
	...defaultConfig,
	themes: {
		dark: {
			...BaseColors,
			...DarkColors,
			color: DarkColors.textColor,
			background: DarkColors.bgPrimarySolid,
		},
	},
	fonts: {
		body: createFont({
			...defaultConfig.fonts.body,
			family: "NotoSans_400Regular",
			face: {
				400: { normal: "NotoSans_400Regular" },
				500: { normal: "NotoSans_500Medium" },
				700: { normal: "NotoSans_700Bold" },
				normal: { normal: "NotoSans_400Regular" },
				medium: { normal: "NotoSans_500Medium" },
				bold: { normal: "NotoSans_700Bold" },
			},
		}),
		mono: createFont({
			...defaultConfig.fonts.body,
			family: "DMMono_400Regular",
			face: {
				400: { normal: "DMMono_400Regular" },
				500: { normal: "DMMono_500Medium" },
				normal: { normal: "DMMono_400Regular" },
				medium: { normal: "DMMono_500Medium" },
			},
		}),
		silk: createFont({
			...defaultConfig.fonts.body,
			family: "SpaceGrotesk_400Regular",
			face: {
				300: { normal: "SpaceGrotesk_300Light" },
				400: { normal: "SpaceGrotesk_400Regular" },
				700: { normal: "SpaceGrotesk_700Bold" },
				light: { normal: "SpaceGrotesk_300Light" },
				normal: { normal: "SpaceGrotesk_400Regular" },
				bold: { normal: "SpaceGrotesk_700Bold" },
			},
		}),
	},
	settings: {
		onlyAllowShorthands: false,
		disableSSR: true,
	},
})

export default config

type Config = typeof config

declare module "tamagui" {
	interface TamaguiCustomConfig extends Config {}
}
