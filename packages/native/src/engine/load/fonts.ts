import * as Font from "expo-font"

//const fontContext = require.context("../../../assets/fonts", false, /\.ttf$/)

const staticFontLoads = {
	NotoSans_400Regular: require("../../../assets/fonts/NotoSans_400Regular.ttf"),
	NotoSans_500Medium: require("../../../assets/fonts/NotoSans_500Medium.ttf"),
	NotoSans_700Bold: require("../../../assets/fonts/NotoSans_700Bold.ttf"),
	DMMono_400Regular: require("../../../assets/fonts/DMMono_400Regular.ttf"),
	DMMono_500Medium: require("../../../assets/fonts/DMMono_500Medium.ttf"),
	SpaceGrotesk_300Light: require("../../../assets/fonts/SpaceGrotesk_300Light.ttf"),
	SpaceGrotesk_400Regular: require("../../../assets/fonts/SpaceGrotesk_400Regular.ttf"),
	SpaceGrotesk_700Bold: require("../../../assets/fonts/SpaceGrotesk_700Bold.ttf"),
}

export default async function () {
	await Font.loadAsync(staticFontLoads)
	// const fontsToLoad = fontContext.keys().reduce(
	// 	(obj, key) => {
	// 		const fontName = key.replace("./", "").replace(".ttf", "")

	// 		obj[fontName] = fontContext(key)
	// 		return obj
	// 	},
	// 	{} as Record<string, any>,
	// )

	// await Font.loadAsync(fontsToLoad)
}
