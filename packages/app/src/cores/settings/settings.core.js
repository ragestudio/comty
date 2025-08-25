import Core from "vessel/core"
import store from "store"
import { Observable } from "rxjs"

import defaultSettings from "@config/defaultSettings.json"

export default class SettingsCore extends Core {
	static namespace = "settings"

	static storeKey = "app_settings"

	storeInstance = null

	public = {
		is: this.is,
		set: this.set,
		get: this.get,
		getDefaults: this.getDefaults,
		withEvent: this.withEvent,
	}

	onInitialize() {
		if ("__ELECTRON__" in window) {
			this.storeInstance = window["__ELECTRON__"].store
		} else {
			this.storeInstance = store
		}

		const settings = this.get()

		// fulfillUndefinedWithDefaults
		Object.keys(defaultSettings).forEach((key) => {
			const value = defaultSettings[key]

			// Only set default if value is undefined
			if (typeof settings[key] === "undefined") {
				this.set(key, value)
			}
		})
	}

	is(key, value) {
		return this.get(key) === value
	}

	set(key, value) {
		const settings = this.get()

		settings[key] = value

		this.storeInstance.set(SettingsCore.storeKey, settings)

		window.app.eventBus.emit("setting.update", { key, value })
		window.app.eventBus.emit(`setting.update.${key}`, value)

		return settings
	}

	get(key) {
		const settings = this.storeInstance.get(SettingsCore.storeKey) ?? {}

		if (typeof key === "undefined") {
			return settings
		}

		return settings[key]
	}

	getDefaults(key) {
		if (typeof key === "undefined") {
			return defaultSettings
		}

		return defaultSettings[key]
	}

	withEvent(listenEvent, defaultValue) {
		let value = defaultValue ?? false

		const observable = new Observable((subscriber) => {
			subscriber.next(value)

			window.app.eventBus.on(listenEvent, (to) => {
				value = to
				subscriber.next(value)
			})
		})

		return observable.subscribe((value) => {
			return value
		})
	}
}
