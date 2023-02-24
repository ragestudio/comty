import React from "react"
import ReactDOM from "react-dom"
import SVG from "react-inlinesvg"

import Core from "evite/src/core"
import config from "config"
import store from "store"
import { ConfigProvider, theme } from "antd"
import RemoteSVGToComponent from "components/RemoteSVGToComponent"

const variantToAlgorithm = {
	light: theme.defaultAlgorithm,
	dark: theme.darkAlgorithm,
}

export class ThemeProvider extends React.Component {
	state = {
		useAlgorigthm: app.cores.style.currentVariant ?? "dark",
		useCompactMode: app.cores.style.getValue("compact-mode"),
	}

	handleUpdate = (update) => {
		console.log("[THEME] Update", update)

		if (update.themeVariant) {
			this.setState({
				useAlgorigthm: update.themeVariant
			})
		}

		this.setState({
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
					...app.cores.style.getValue(),
				},
				algorithm: themeAlgorithms,
			}}
		>
			{this.props.children}
		</ConfigProvider>
	}
}

export default class StyleCore extends Core {
	static namespace = "style"

	static themeManifestStorageKey = "theme"
	static modificationStorageKey = "themeModifications"

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

	static get storagedTheme() {
		return store.get(StyleCore.themeManifestStorageKey)
	}

	static get storagedVariant() {
		return app.cores.settings.get("style.darkMode") ? "dark" : "light"
	}

	static set storagedModifications(modifications) {
		return store.set(StyleCore.modificationStorageKey, modifications)
	}

	static get storagedModifications() {
		return store.get(StyleCore.modificationStorageKey) ?? {}
	}

	async onInitialize() {
		if (StyleCore.storagedTheme) {
			// TODO: Start remote theme loader 
		} else {
			this.public.theme = config.defaultTheme
		}

		const modifications = StyleCore.storagedModifications
		const variantKey = StyleCore.storagedVariant

		// override with static vars
		if (this.public.theme.defaultVars) {
			this.update(this.public.theme.defaultVars)
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

			if (window.app.cores.settings.get("auto_darkMode")) {
				this.handleAutoColorScheme()
			}
		})

		if (window.app.cores.settings.get("auto_darkMode")) {
			this.handleAutoColorScheme()
		}
	}

	onEvents = {
		"style.autoDarkModeToogle": (value) => {
			if (value === true) {
				this.handleAutoColorScheme()
			} else {
				this.applyVariant(StyleCore.storagedVariant)
			}
		}
	}

	public = {
		theme: null,
		mutation: null,
		currentVariant: "dark",

		getValue: (...args) => this.getValue(...args),
		setDefault: () => this.setDefault(),
		update: (...args) => this.update(...args),
		applyVariant: (...args) => this.applyVariant(...args),
		compactMode: (value = !window.app.cores.settings.get("style.compactMode")) => {
			if (value) {
				return this.update({
					layoutMargin: 0,
					layoutPadding: 0,
				})
			}

			return this.update({
				layoutMargin: this.getValue("layoutMargin"),
				layoutPadding: this.getValue("layoutPadding"),
			})
		},
		modify: (value) => {
			this.public.update(value)

			this.applyVariant(this.public.mutation.themeVariant ?? this.public.currentVariant)

			StyleCore.storagedModifications = this.public.mutation
		},
		defaultVar: (key) => {
			if (!key) {
				return this.public.theme.defaultVars
			}

			return this.public.theme.defaultVars[key]
		},
		storagedVariant: StyleCore.storagedVariant,
		storagedModifications: StyleCore.storagedModifications,
	}

	getValue(key) {
		if (typeof key === "undefined") {
			return {
				...this.public.theme.defaultVars,
				...StyleCore.storagedModifications
			}
		}

		return StyleCore.storagedModifications[key] || this.public.theme.defaultVars[key]
	}

	setDefault() {
		store.remove(StyleCore.themeManifestStorageKey)
		store.remove(StyleCore.modificationStorageKey)

		app.cores.settings.set("colorPrimary", this.public.theme.defaultVars.colorPrimary)

		this.onInitialize()
	}

	update(update) {
		if (typeof update !== "object") {
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

		ConfigProvider.config({ theme: this.public.mutation })
	}

	applyVariant(variant = (this.public.theme.defaultVariant ?? "light")) {
		const values = this.public.theme.variants[variant]

		if (!values) {
			console.error(`Variant [${variant}] not found`)
			return false
		}

		values.themeVariant = variant

		this.public.currentVariant = variant

		this.update(values)
	}

	handleAutoColorScheme() {
		const prefered = window.matchMedia("(prefers-color-scheme: light)")

		if (!prefered.matches) {
			this.applyVariant("dark")
		} else {
			this.applyVariant("light")
		}
	}
}