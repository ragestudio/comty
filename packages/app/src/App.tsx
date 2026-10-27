import { Runtime, VesselApp, VesselAppProps } from "@ragestudio/vessel/runtime"
import ReactAdapter from "@ragestudio/vessel/adapters/react"

import React from "react"
import * as Router from "@ragestudio/vessel/router"
import * as Sentry from "@sentry/browser"

import { ThemeProvider } from "@cores/style/style.core"
import NotificationsRenderer from "./cores/notifications/render"

import { rtcService } from "@comty/spaces-sdk/rtc"
import { startWebPersistence } from "@comty/spaces-sdk/db/persister-web"
import { initializeRtcAdapter } from "@comty/spaces-sdk/rtc/web"

import AppCrash from "@components/AppCrash"
import Layout from "./layout"
import StaticMethods from "./statics/methods"
import StaticEvents from "./statics/events"
import StaticRenders from "./statics/renders"
import initAuth from "./auth"
import initRealtime from "./realtime"
import initRtcEvents from "./realtime/rtcEvents"

import config from "@config"
import routesDeclarations from "@config/routes"
import onPageMount from "@hooks/onPageMount"

import "@styles/index.less"

class ComtyApp extends React.Component<VesselAppProps> implements VesselApp {
	// "mierda conocida, mejor que mierda por conocer" - yugel nunca dijo. 2025.
	static readonly publicEvents = StaticEvents
	static readonly publicMethods = StaticMethods
	static readonly staticRenders = StaticRenders
	//static splashAwaitEvent = "app.initialization.finish"

	state = {
		firstInitialized: false,
	}

	auth = initAuth(this.props.runtime, {
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
	})

	notificationsRef = React.createRef()

	static async initialize() {
		window.app.version = config.package.version
		window.app.isCapacitor = window["IS_MOBILE_HOST"]

		// restore the spaces cache before any store starts querying it
		await startWebPersistence()

		// register the web rtc adapter (audio playback, processing and routing)
		await initializeRtcAdapter()

		// if in production, initialize Sentry (if VITE_SENTRY_DSN is set)
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
		// @ts-ignore
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

		initRealtime()
		initRtcEvents()

		await this.auth.initialize()
		await rtcService.initialize()

		app.eventBus.emit("app.initialization.finish")
	}

	render() {
		return (
			<ThemeProvider>
				<AppCrash>
					<NotificationsRenderer ref={this.notificationsRef} />
					<Router.Router
						declarations={routesDeclarations}
						staticRenders={ComtyApp.staticRenders}
						onPageMount={onPageMount}
					>
						<Layout staticRenders={ComtyApp.staticRenders}>
							{this.state.firstInitialized && <Router.Render />}
						</Layout>
					</Router.Router>
				</AppCrash>
			</ThemeProvider>
		)
	}
}

export default new Runtime(ComtyApp, ReactAdapter)
