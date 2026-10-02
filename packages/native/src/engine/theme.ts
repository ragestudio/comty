import type { App } from "./app"
import { getThemes } from "tamagui"

export class ThemeController {
	constructor(private app: App) {}

	currentKey = "dark"

	get currentTheme() {
		return getThemes()[this.currentKey]
	}
}

export default ThemeController
