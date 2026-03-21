import isDev from "../../utils/isDev.js"
import ElectronStore from "electron-store"
import defaults from "./default.json" with { type: "json" }

export default class Settings {
	constructor(main) {
		this.main = main
		this.store = new ElectronStore({
			name: isDev() ? "settings_dev" : "settings",
			defaults: defaults,
		})

		return this.store
	}
}
