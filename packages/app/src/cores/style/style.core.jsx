import React from "react"
import Core from "evite/src/core"

import { ConfigProvider, theme } from "antd"
import store from "store"

import config from "@config"

const variantToAlgorithm = {
	light: theme.defaultAlgorithm,
	dark: theme.darkAlgorithm,
}

const ClientPrefersDark = () => window.matchMedia("(prefers-color-scheme: dark)")

function variantKeyToColor(key) {
	if (key == "auto") {
		if (ClientPrefersDark().matches) {
			return "dark"
		}

		return "light"
	}

	return key
}


export class ThemeProvider extends React.Component {
	state = {
		useAlgorigthm: variantKeyToColor(app.cores.style.currentVariantKey),
		useCompactMode: app.cores.style.getVar("compact-mode"),
	}

	handleUpdate = (update) => {
		console.log("[THEME] Update", update)

		this.setState({
			useAlgorigthm: variantKeyToColor(app.cores.style.currentVariantKey),
			useCompactMode: update["compact-mode"]
		})
	}

	componentDidMount() {
		app.eventBus.on("style.update", this.handleUpdate)
	}

	componentWillUnmount() {
		app.eventBus.off("style.update", this.handleUpdate)
	}

	render() {
		const themeAlgorithms = [
			variantToAlgorithm[this.state.useAlgorigthm ?? "dark"],
		]

		if (this.state.useCompactMode) {
			themeAlgorithms.push(theme.compactAlgorithm)
		}

		return <ConfigProvider
			theme={{
				token: {
					...app.cores.style.getVar(),
				},
				algorithm: themeAlgorithms,
			}}
			componentSize={
				app.isMobile ? "large" : "middle"
			}
		>
			{this.props.children}
		</ConfigProvider>
	}
}

export default class StyleCore extends Core {
	static namespace = "style"

	static dependencies = ["settings"]

	static modificationStorageKey = "theme-modifications"
	static defaultVariantKey = "auto"

	static get rootVariables() {
		let attributes = document.documentElement.getAttribute("style").trim().split(";")

		attributes = attributes.slice(0, (attributes.length - 1))

		attributes = attributes.map((variable) => {
			let [key, value] = variable.split(":")
			key = key.split("--")[1]

			return [key, value]
		})

		return Object.fromEntries(attributes)
	}

	static get storagedVariantKey() {
		return app.cores.settings.get("style:theme_variant")
	}

	static set storagedVariantKey(key) {
		return app.cores.settings.set("style:theme_variant", key)
	}

	isOnTemporalVariant = false

	// modifications 
	static get storagedModifications() {
		return store.get(StyleCore.modificationStorageKey) ?? {}
	}

	static set storagedModifications(modifications) {
		return store.set(StyleCore.modificationStorageKey, modifications)
	}

	public = {
		theme: null,
		mutation: null,
		currentVariantKey: null,

		getVar: (...args) => this.getVar(...args),
		getDefaultVar: (...args) => this.getDefaultVar(...args),
		getStoragedVariantKey: () => StyleCore.storagedVariantKey,

		applyStyles: (...args) => this.applyStyles(...args),
		applyVariant: (...args) => this.applyVariant(...args),
		applyTemporalVariant: (...args) => this.applyTemporalVariant(...args),

		mutateTheme: (...args) => this.mutateTheme(...args),
		resetToDefault: () => this.resetToDefault(),
		toggleCompactMode: () => this.toggleCompactMode(),
	}

	async onInitialize() {
		this.public.theme = config.defaultTheme

		const modifications = StyleCore.storagedModifications

		// override with static vars
		if (this.public.theme.defaultVars) {
			this.applyStyles(this.public.theme.defaultVars)
		}

		// override theme with modifications
		if (modifications) {
			this.applyStyles(modifications)
		}

		// apply variation
		this.applyVariant(StyleCore.storagedVariantKey ?? StyleCore.defaultVariantKey)

		// if mobile set fontScale to 1
		if (app.isMobile) {
			this.applyStyles({
				fontScale: 1
			})
		}

		ClientPrefersDark().addEventListener("change", (event) => {
			this.console.log("[PREFERS-DARK] Change >", event.matches)

			if (this.isOnTemporalVariant) {
				return false
			}

			if (event.matches) {
				this.applyVariant("dark")
			} else {
				this.applyVariant("light")
			}
		})
	}

	getVar(key) {
		if (typeof key === "undefined") {
			return {
				...this.public.theme.defaultVars,
				...StyleCore.storagedModifications,
			}
		}

		return StyleCore.storagedModifications[key] || this.public.theme.defaultVars[key]
	}

	getDefaultVar(key) {
		if (!key) {
			return this.public.theme.defaultVars
		}

		return this.public.theme.defaultVars[key]
	}

	applyStyles(update) {
		if (typeof update !== "object") {
			this.console.error("Invalid update, must be an object")
			return false
		}

		this.public.mutation = {
			...this.public.theme.defaultVars,
			...this.public.mutation,
			...update
		}

		Object.keys(this.public.mutation).forEach(key => {
			document.documentElement.style.setProperty(`--${key}`, this.public.mutation[key])
		})

		app.eventBus.emit("style.update", {
			...this.public.mutation,
		})
	}

	applyVariant = (variantKey = (this.public.theme.defaultVariant ?? "light"), save = true) => {
		if (save) {
			StyleCore.storagedVariantKey = variantKey
			this.public.currentVariantKey = variantKey
		}

		this.isOnTemporalVariant = false

		this.console.log(`Input variant key [${variantKey}]`)

		const color = variantKeyToColor(variantKey)

		this.console.log(`Applying variant [${color}]`)

		const values = this.public.theme.variants[color]

		if (!values) {
			this.console.error(`Variant [${color}] not found`)
			return false
		}

		this.applyStyles(values)
	}

	applyTemporalVariant = (variantKey) => {
		this.applyVariant(variantKey, false)

		this.isOnTemporalVariant = true
	}

	mutateTheme(update) {
		this.applyStyles(update)
		this.applyVariant(this.public.currentVariantKey)

		StyleCore.storagedModifications = this.public.mutation
	}

	toggleCompactMode(value = !window.app.cores.settings.get("style.compactMode")) {
		if (value === true) {
			return this.applyStyles({
				layoutMargin: 0,
				layoutPadding: 0,
			})
		}

		return this.applyStyles({
			layoutMargin: this.getVar("layoutMargin"),
			layoutPadding: this.getVar("layoutPadding"),
		})
	}

	resetToDefault() {
		store.remove(StyleCore.modificationStorageKey)

		app.cores.settings.set("colorPrimary", this.public.theme.defaultVars.colorPrimary)

		this.onInitialize()
	}
}