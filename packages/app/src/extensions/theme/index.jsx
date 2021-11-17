import React from "react"
import config from "config"

const themeConfig = config.theme ?? {}

//themeConfig["primary-color"]

const BaseThemeVars = {
    "primary-color": "#32b7bb",
}

class ThemeController {
	constructor(params) {
		this.params = { ...params }
		this.vars = Object()
		this.root = document.documentElement

		// init
        this.init()
	}

    init = () => {
        Object.keys(BaseThemeVars).forEach(key => {
            this.updateVar(key, BaseThemeVars[key])
        })
    }

	updateVar = (key, value) => {
		return this.root.style.setProperty(`--${key}`, value)
	}

	generate = (payload = {}) => {
		const { variables } = payload
	}

	load = (payload) => {

    }
}

export default {
	key: "theme",
	expose: [
		{
			initialization: [
				async (app, main) => {
					app.themeController = new ThemeController()
					main.setToWindowContext("themeController", app.themeController)
				},
			],
		},
	],
}
