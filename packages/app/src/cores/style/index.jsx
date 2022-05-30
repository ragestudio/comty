import Core from "evite/src/core"
import config from "config"
import store from "store"
import { ConfigProvider } from "antd"

export default class StyleCore extends Core {
	themeManifestStorageKey = "theme"
	modificationStorageKey = "themeModifications"

	theme = null
	mutation = null
	currentVariant = null

	events = {
		"app.autoDarkModeToogle": (value) => {
			if (value === true) {
				this.handleAutoColorScheme()
			}else {
				this.applyVariant(this.getStoragedVariant())
			}
		},
		"theme.applyVariant": (value) => {
			this.applyVariant(value)
			this.setVariant(value)
		},
		"modifyTheme": (value) => {
			this.update(value)
			this.setModifications(this.mutation)
		},
		"resetTheme": () => {
			this.resetDefault()
		}
	}

	publicMethods = {
		style: this
	}

	static get currentVariant() {
		return document.documentElement.style.getPropertyValue("--themeVariant")
	}

	handleAutoColorScheme() {
		const prefered = window.matchMedia("(prefers-color-scheme: light)")

		if (!prefered.matches) {
			this.applyVariant("dark")
		} else {
			this.applyVariant("light")
		}
	}

	initialize = async () => {
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

		// handle auto prefered color scheme
		window.matchMedia("(prefers-color-scheme: light)").addListener(() => {
			console.log(`[THEME] Auto color scheme changed`)
			
			if (window.app.settings.get("auto_darkMode")) {
				this.handleAutoColorScheme()
			}
		})

		if (window.app.settings.get("auto_darkMode")) {
			this.handleAutoColorScheme()
		}
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
		return app.settings.get("themeVariant")
	}

	setVariant = (variationKey) => {
		return app.settings.set("themeVariant", variationKey)
	}

	setModifications = (modifications) => {
		return store.set(this.modificationStorageKey, modifications)
	}

	resetDefault = () => {
		store.remove(this.themeManifestStorageKey)
		store.remove(this.modificationStorageKey)

		window.app.settings.set("primaryColor", this.theme.staticVars.primaryColor)

		this.initialize()
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
		}
	}
}