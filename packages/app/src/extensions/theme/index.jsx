import config from "config"
import store from "store"
import { ConfigProvider } from "antd"

export class ThemeController {
	constructor(params) {
		this.params = { ...params }

		this.themeManifestStorageKey = "theme"
		this.modificationStorageKey = "themeModifications"
		this.variantStorageKey = "themeVariation"

		this.theme = null

		this.mutation = null
		this.currentVariant = null

		this.init()

		return this
	}

	static get currentVariant() {
		return document.documentElement.style.getPropertyValue("--themeVariant")
	}

	init = () => {
		let theme = this.getStoragedTheme()
		const modifications = this.getStoragedModifications()
		const variantKey = this.getStoragedVariant()

		if (!theme) {
			// load default theme
			theme = this.getDefaultTheme()
		} else {
			// load URL and initialize theme
		}

		// set global theme
		this.theme = theme

		// override with static vars
		if (theme.staticVars) {
			this.update(theme.staticVars)
		}

		// override theme with modifications
		if (modifications) {
			this.update(modifications)
		}

		// apply variation
		this.applyVariant(variantKey)
	}

	getRootVariables = () => {
		let attributes = document.documentElement.getAttribute("style").trim().split(";")
		attributes = attributes.slice(0, (attributes.length - 1))
		attributes = attributes.map((variable) => {
			let [key, value] = variable.split(":")
			key = key.split("--")[1]

			return [key, value]
		})

		return Object.fromEntries(attributes)
	}

	getDefaultTheme = () => {
		// TODO: Use evite CONSTANTS_API
		return config.defaultTheme
	}

	getStoragedTheme = () => {
		return store.get(this.themeManifestStorageKey)
	}

	getStoragedModifications = () => {
		return store.get(this.modificationStorageKey)
	}

	getStoragedVariant = () => {
		return store.get(this.variantStorageKey)
	}

	setVariant = (variationKey) => {
		return store.set(this.variantStorageKey, variationKey)
	}

	setModifications = (modifications) => {
		return store.set(this.modificationStorageKey, modifications)
	}

	resetDefault = () => {
		store.remove(this.themeManifestStorageKey)
		store.remove(this.modificationStorageKey)

		return this.init()
	}

	update = (update) => {
		if (typeof update !== "object") {
			return false
		}

		this.mutation = {
			...this.theme.staticVars,
			...this.mutation,
			...update
		}

		Object.keys(this.mutation).forEach(key => {
			document.documentElement.style.setProperty(`--${key}`, this.mutation[key])
		})

		document.documentElement.className = `theme-${this.currentVariant}`
		document.documentElement.style.setProperty(`--themeVariant`, this.currentVariant)

		ConfigProvider.config({ theme: this.mutation })
	}

	applyVariant = (variant = (this.theme.defaultVariant ?? "light")) => {
		const values = this.theme.variants[variant]

		if (values) {
			this.currentVariant = variant
			this.update(values)
			this.setVariant(variant)
		}
	}
}

export const extension = {
	key: "theme",
	expose: [
		{
			initialization: [
				async (app, main) => {
					app.ThemeController = new ThemeController()

					main.eventBus.on("darkMode", (value) => {
						if (value) {
							app.ThemeController.applyVariant("dark")
						} else {
							app.ThemeController.applyVariant("light")
						}
					})
					main.eventBus.on("modifyTheme", (value) => {
						app.ThemeController.update(value)
						app.ThemeController.setModifications(app.ThemeController.mutation)
					})
					main.eventBus.on("resetTheme", () => {
						app.ThemeController.resetDefault()
					})

					main.setToWindowContext("ThemeController", app.ThemeController)
				},
			],
		},
	],
}

export default extension