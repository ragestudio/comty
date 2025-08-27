import ElectronStore from "electron-store"

import defaults from "./default.json" with { type: "json" }

export default class Settings {
	constructor(main) {
		this.main = main
		this.store = new ElectronStore({
			name: "settings",
			defaults: defaults,
		})

		return this.store
	}
}
