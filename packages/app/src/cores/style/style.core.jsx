import Core from "vessel/core"
import React from "react"
import { ConfigProvider, theme } from "antd"
import store from "store"
import lessToJs from "less-vars-to-js"

import config from "@config"
import builtInVars from "@styles/vars.less?raw"

const variantToAlgorithm = {
	light: theme.defaultAlgorithm,
	dark: theme.darkAlgorithm,
}

const ClientPrefersDark = () =>
	window.matchMedia("(prefers-color-scheme: dark)")

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
		useCompactMode: app.cores.style.vars["compact-mode"],
	}

	handleUpdate = (update) => {
		this.setState({
			useAlgorigthm: variantKeyToColor(app.cores.style.currentVariantKey),
			useCompactMode: update["compact-mode"],
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

		return (
			<ConfigProvider
				theme={{
					token: {
						...app.cores.style.vars,
					},
					algorithm: themeAlgorithms,
				}}
				componentSize={app.isMobile ? "large" : "middle"}
			>
				{this.props.children}
			</ConfigProvider>
		)
	}
}

export default class StyleCore extends Core {
	static namespace = "style"
	static dependencies = ["settings"]

	static modificationStorageKey = "theme-modifications"
	static defaultVariantKey = "auto"

	// root
	static get documentHead() {
		return document.getElementsByTagName("head")[0]
	}

	static get rootAppVarsElement() {
		return StyleCore.documentHead.querySelector("#app_vars")
	}

	static get rootAppVariables() {
		let rootRules = StyleCore.rootAppVarsElement.childNodes[0]

		rootRules = rootRules.textContent

		rootRules = rootRules.replace(/\n/g, "").replace(/\t/g, "").trim()

		rootRules = rootRules
			.replace(/:root\s?\{/, "")
			.replace(/\}/, "")
			.trim()

		rootRules = rootRules.split(";")

		rootRules = rootRules.filter((i) => i.length > 0)

		rootRules = rootRules.map((rule) => {
			return rule.split(":").map((i) => i.trim())
		})

		return rootRules.reduce((acc, [key, value]) => {
			if (key.startsWith("--")) {
				acc[key.replace("--", "")] = value
			}
			return acc
		}, {})
	}

	// variants
	static get storagedVariantKey() {
		return app.cores.settings.get("style:theme_variant")
	}

	static set storagedVariantKey(key) {
		app.cores.settings.set("style:theme_variant", key)
	}

	// modifications
	static get storagedModifications() {
		return store.get(StyleCore.modificationStorageKey) ?? {}
	}

	static set storagedModifications(modifications) {
		store.set(StyleCore.modificationStorageKey, modifications)
	}

	public = {
		theme: null,
		vars: null,
		currentVariantKey: null,

		getRootVar: (key) => {
			const rootVars = StyleCore.rootAppVariables

			if (typeof key !== "undefined") {
				return rootVars[key]
			}

			return rootVars
		},
		getStoragedVariantKey: () => StyleCore.storagedVariantKey,

		applyVars: (...args) => this.applyVars(...args),
		updateVariant: (...args) => this.updateVariant(...args),
		updateTemporalVariant: (...args) => this.updateTemporalVariant(...args),

		modifyTheme: (...args) => this.modifyTheme(...args),
		resetToDefault: () => this.resetToDefault(),
	}

	isOnTemporalVariant = false

	async onInitialize() {
		// add platform specific classnames
		if (app.isMobile) {
			document.documentElement.classList.add("mobile")
		}

		if (app.isDesktop) {
			document.documentElement.classList.add("desktop")
		}

		// create root css main node if not exists
		if (!StyleCore.rootAppVarsElement) {
			const styleElement = document.createElement("style")
			styleElement.id = "app_vars"

			// append to head
			StyleCore.documentHead.appendChild(styleElement)
		}

		// load theme
		// TODO: support for custom themes, by now use the defaultTheme
		this.public.theme = config.defaultTheme

		// convert less vars to js object
		let builtInVarsRules = lessToJs(builtInVars, { stripPrefix: true })

		// sanitazie builtInVarsRules
		builtInVarsRules = Object.entries(builtInVarsRules).reduce(
			(acc, [key, value]) => {
				if (typeof value === "string") {
					return {
						...acc,
						[key]: value
							.replace(/\n/g, "")
							.replace(/\t/g, "")
							.trim(),
					}
				}
				return acc
			},
			{},
		)

		// fullfill defaultVars with builtIn vars from vars.less
		this.public.theme.defaultVars = {
			...this.public.theme.defaultVars,
			...builtInVarsRules,
		}

		// set the current variant key
		this.public.variantKey =
			StyleCore.storagedVariantKey ??
			this.public.theme.defaultVariant ??
			StyleCore.defaultVariantKey

		// get the variant values
		const variantValues =
			this.public.theme.variants[
				variantKeyToColor(this.public.variantKey)
			] ?? {}

		// define vars
		this.public.vars = {
			...this.public.theme.defaultVars,
			...variantValues,
			...StyleCore.storagedModifications,
		}

		// apply vars
		this.applyVars()

		// listen to client auto theme preference
		ClientPrefersDark().addEventListener("change", (event) => {
			if (this.isOnTemporalVariant) {
				return false
			}

			this.console.log("[PREFERS-DARK] Change >", event.matches)

			if (event.matches) {
				this.updateVariant("dark")
			} else {
				this.updateVariant("light")
			}
		})
	}

	updateVars(update) {
		if (typeof update !== "object") {
			this.console.error("Invalid update, must be an object")
			return false
		}

		// modify vars
		this.public.vars = {
			...this.public.theme.defaultVars,
			...this.public.vars,
			...update,
		}

		// emit event to eventBus
		app.eventBus.emit("style.update", {
			...this.public.mutation,
		})

		// apply to root
		return this.applyVars()
	}

	applyVars() {
		// create css :root variables string
		let css = Object.entries(this.public.vars).reduce(
			(acc, [key, value]) => {
				return `${acc}\n--${key}: ${value};`
			},
			"",
		)

		css = `:root { ${css} }`

		// find app_vars
		const stylesElement = StyleCore.rootAppVarsElement

		// if not exist a child, append a new node with css rules,
		// else replace the first node with updated css rules
		if (!stylesElement.childNodes[0]) {
			stylesElement.appendChild(document.createTextNode(css))
		} else {
			stylesElement.replaceChild(
				document.createTextNode(css),
				stylesElement.childNodes[0],
			)
		}
	}

	updateVariant(
		variantKey = this.public.theme.defaultVariant ?? "light",
		save = true,
		temporal = false,
	) {
		if (save === true && temporal === false) {
			StyleCore.storagedVariantKey = variantKey
		}

		const values = this.public.theme.variants[variantKeyToColor(variantKey)]

		if (!values) {
			this.console.error(`Variant [${variantKey}] not found`)
			return false
		}

		this.isOnTemporalVariant = temporal
		this.public.variantKey = variantKey

		return this.updateVars(values)
	}

	updateTemporalVariant(variantKey) {
		this.updateVariant(variantKey, false, true)
	}

	modifyTheme(update) {
		StyleCore.storagedModifications = update
		return this.updateVars(update)
	}

	resetToDefault() {
		store.remove(StyleCore.modificationStorageKey)
		this.onInitialize()
	}
}
