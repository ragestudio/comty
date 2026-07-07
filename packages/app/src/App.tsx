import { Runtime } from "vessel/runtime"
import ReactAdapter from "vessel/adapters/react"

import React from "react"
import * as antd from "antd"
import * as Router from "vessel/router"
import * as Sentry from "@sentry/browser"
import { ThemeProvider } from "@cores/style/style.core.jsx"
import NotificationsRenderer from "./cores/notifications/render"
import AppCrash from "@components/AppCrash"
import AuthManager from "@classes/AuthManager"
import Layout from "./layout"
import StaticMethods from "./statics/methods"
import StaticEvents from "./statics/events"
import StaticRenders from "./statics/renders"

import config from "@config"
import routesDeclarations from "@config/routes"
import onPageMount from "@hooks/onPageMount"

import "@styles/index.less"
import { VesselApp } from "vessel/runtime"

class ComtyApp extends React.Component implements VesselApp {
	// "mierda conocida, mejor que mierda por conocer" - yugel nunca dijo. 2025.
	static publicEvents = StaticEvents
	static publicMethods = StaticMethods
	static staticRenders = StaticRenders
	//static splashAwaitEvent = "app.initialization.finish"

	state = {
		firstInitialized: false,
	}

	auth = new AuthManager(this.props.runtime, {
		behaviors: {
			onLogin: async () => {
				app.navigation.goMain()
			},
			onLogout: async () => {
				app.navigation.goAuth()
			},
			onInvalidSession: async () => {
				app.navigation.goAuth()
			},
			onDisabledAccount: async () => {
				app.navigation.goAuth()
			},
		},
	})

	notificationsRef = React.createRef()

	static async initialize() {
		window.app.version = config.package.version
		window.app.isCapacitor = window.IS_MOBILE_HOST

		if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.PROD) {
			console.log(`Initializing Sentry...`)

			Sentry.init({
				debug: true,
				dsn: import.meta.env.VITE_SENTRY_DSN,
				release: "comty-web-app",
			})
		}
	}

	componentDidMount = async () => {
		const notfCore = this.props.runtime.cores.get("notifications")
		app.message = notfCore.message

		if (notfCore) {
			notfCore.ui.mount(this.notificationsRef)
		}

		await this.initialization()
		this.setState({ firstInitialized: true })

		app.cores.sfx.play("splash_out")

		if (window.app.version !== window.localStorage.getItem("last_version")) {
			app.message.info(
				`Comty has been updated to version ${window.app.version}!`,
			)
			window.localStorage.setItem("last_version", window.app.version)
		}
	}

	initialization = async () => {
		app.eventBus.emit("app.initialization.start")

		await this.auth.initialize()

		app.eventBus.emit("app.initialization.finish")
	}

	render() {
		return (
			<React.Fragment>
				<ThemeProvider>
					<AppCrash>
						<NotificationsRenderer ref={this.notificationsRef} />
						<Layout staticRenders={ComtyApp.staticRenders}>
							{this.state.firstInitialized && (
								<Router.Render
									declarations={routesDeclarations}
									staticRenders={ComtyApp.staticRenders}
									onPageMount={onPageMount}
								/>
							)}
						</Layout>
					</AppCrash>
				</ThemeProvider>
			</React.Fragment>
		)
	}
}

export default new Runtime(ComtyApp, ReactAdapter)
