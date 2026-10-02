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
			family: "NotoSans",
			face: {
				normal: {
					normal: "NotoSans_400Regular",
				},
				bold: {
					normal: "NotoSans_700Bold",
				},
			},
		}),
		mono: createFont({
			...defaultConfig.fonts.body,
			family: "DMMono",
			face: {
				normal: {
					normal: "DMMono_400Regular",
				},
				medium: {
					normal: "DMMono_500Medium",
				},
			},
		}),
		silk: createFont({
			...defaultConfig.fonts.body,
			family: "SpaceGrotesk",
			face: {
				light: {
					normal: "SpaceGrotesk_300Light",
				},
				normal: {
					normal: "SpaceGrotesk_400Regular",
				},
				bold: {
					normal: "SpaceGrotesk_700Bold",
				},
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
