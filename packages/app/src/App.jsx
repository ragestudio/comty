import React from "react"
import * as antd from "antd"
import { Runtime } from "@ragestudio/vessel"
import * as Router from "@ragestudio/vessel/router"
import * as Sentry from "@sentry/browser"
import { ThemeProvider } from "@cores/style/style.core.jsx"
import AuthManager from "@classes/AuthManager"
import Layout from "./layout"

import StaticMethods from "./statics/methods"
import StaticEvents from "./statics/events"
import StaticRenders from "./statics/renders"

import DesktopTopBar from "@components/DesktopTopBar"

import config from "@config"
import routesDeclarations from "@config/routes"
import onPageMount from "@hooks/onPageMount"

import "@ant-design/v5-patch-for-react-19"
import "@styles/index.less"

class ComtyApp extends React.Component {
	// "mierda conocida, mejor que mierda por conocer" - yugel nunca dijo. 2025.
	static publicEvents = StaticEvents
	static publicMethods = StaticMethods
	static staticRenders = StaticRenders
	//static splashAwaitEvent = "app.initialization.finish"

	state = {
		firstInitialized: false,
	}

	auth = new AuthManager(
		{
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
		},
		this.props.runtime,
	)

	static async initialize() {
		window.app.version = config.package.version
		window.app.confirm = antd.Modal.confirm
		window.app.message = antd.message
		window.app.isCapacitor = window.IS_MOBILE_HOST

		if (
			window.app.version !== window.localStorage.getItem("last_version")
		) {
			app.message.info(
				`Comty has been updated to version ${window.app.version}!`,
			)
			window.localStorage.setItem("last_version", window.app.version)
		}

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
		await this.initialization()
		this.setState({ firstInitialized: true })
		app.cores.sfx.play("splash_out")
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
					{app.isDesktop && <DesktopTopBar />}
					<Layout staticRenders={ComtyApp.staticRenders}>
						{this.state.firstInitialized && (
							<Router.Render
								declarations={routesDeclarations}
								staticRenders={ComtyApp.staticRenders}
								onPageMount={onPageMount}
							/>
						)}
					</Layout>
				</ThemeProvider>
			</React.Fragment>
		)
	}
}

export default new Runtime(ComtyApp)
