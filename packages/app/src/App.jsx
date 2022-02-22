// Patch global prototypes
Array.prototype.findAndUpdateObject = function (discriminator, obj) {
	let index = this.findIndex(item => item[discriminator] === obj[discriminator])
	if (index !== -1) {
		this[index] = obj
	}

	return index
}

Array.prototype.move = function (from, to) {
	this.splice(to, 0, this.splice(from, 1)[0])
	return this
}

String.prototype.toTitleCase = function () {
	return this.replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
	})
}

Promise.tasked = function (promises) {
	return new Promise(async (resolve, reject) => {
		let rejected = false

		for await (let promise of promises) {
			if (rejected) {
				return
			}

			try {
				await promise()
			} catch (error) {
				rejected = true
				return reject(error)
			}
		}

		if (!rejected) {
			return resolve()
		}
	})
}

import React from "react"
import { CreateEviteApp, BindPropsProvider } from "evite"
import { Helmet } from "react-helmet"
import * as antd from "antd"
import { ActionSheet, Toast } from "antd-mobile"
import { StatusBar, Style } from "@capacitor/status-bar"
import { Translation } from "react-i18next"

import { Session, User } from "models"
import { API, SettingsController, Render, Splash, Theme, Sound, Notifications, i18n } from "extensions"
import config from "config"

import { NotFound, RenderError, Crash, Settings, Navigation } from "components"
import { Icons } from "components/Icons"

import Layout from "./layout"
import "theme/index.less"

const SplashExtension = Splash.extension({
	logo: config.logo.alt,
	preset: "fadeOut",
	velocity: 1000,
	props: {
		logo: {
			style: {
				marginBottom: "10%",
				stroke: "black",
			},
		},
	},
})

class App {
	static initialize() {
		window.app.version = config.package.version

		this.mainSocket = this.contexts.app.WSInterface.sockets.main
		this.loadingMessage = false
		this.isAppCapacitor = () => navigator.userAgent === "capacitor"
	}

	static eventsHandlers = {
		"new_session": async function () {
			await this.flushState()
			await this.initialization()

			if (window.location.pathname == "/login") {
				window.app.setLocation(this.beforeLoginLocation ?? "/main")
				this.beforeLoginLocation = null
			}
		},
		"destroyed_session": async function () {
			await this.flushState()
			this.eventBus.emit("forceToLogin")
		},
		"forceToLogin": function () {
			if (window.location.pathname !== "/login") {
				this.beforeLoginLocation = window.location.pathname
			}

			window.app.setLocation("/login")
		},
		"invalid_session": async function (error) {
			await this.sessionController.forgetLocalSession()
			await this.flushState()

			if (window.location.pathname !== "/login") {
				this.eventBus.emit("forceToLogin")

				antd.notification.open({
					message: <Translation>
						{(t) => t("Invalid Session")}
					</Translation>,
					description: <Translation>
						{(t) => t(error)}
					</Translation>,
					icon: <Icons.MdOutlineAccessTimeFilled />,
				})
			}
		},
		"clearAllOverlays": function () {
			window.app.DrawerController.closeAll()
		},
		"websocket_connected": function () {
			if (this.wsReconnecting) {
				this.wsReconnectingTry = 0
				this.wsReconnecting = false
				this.initialization()

				setTimeout(() => {
					Toast.show({
						icon: "success",
						content: "Connected",
					})
				}, 500)
			}
		},
		"websocket_connection_error": function () {
			if (!this.wsReconnecting) {
				this.latencyWarning = null
				this.wsReconnectingTry = 0
				this.wsReconnecting = true

				Toast.show({
					icon: "loading",
					content: "Connecting...",
					duration: 0,
				})
			}

			this.wsReconnectingTry = this.wsReconnectingTry + 1

			if (this.wsReconnectingTry > 3) {
				window.location.reload()
			}
		},
		"websocket_latency_too_high": function () {
			if (!this.latencyWarning) {
				this.latencyWarning = true
				Toast.show({
					icon: "loading",
					content: "Slow connection...",
					duration: 0,
				})
			}
		},
		"websocket_latency_normal": function () {
			if (this.latencyWarning) {
				this.latencyWarning = null
				Toast.show({
					icon: "success",
					content: "Connection restored",
				})
			}
		}
	}

	static windowContext() {
		return {
			// TODO: Open with popup controller instead drawer controller
			openNavigationMenu: () => window.app.DrawerController.open("navigation", Navigation),
			openSettings: (goTo) => {
				window.app.DrawerController.open("settings", Settings, {
					props: {
						width: "fit-content",
					},
					componentProps: {
						goTo,
					}
				})
			},
			goMain: () => {
				return window.app.setLocation(config.app.mainPath)
			},
			goToAccount: (username) => {
				return window.app.setLocation(`/account`, { username })
			},
			setStatusBarStyleDark: async () => {
				if (!this.isAppCapacitor()) {
					console.warn("[App] setStatusBarStyleDark is only available on capacitor")
					return false
				}
				return await StatusBar.setStyle({ style: Style.Dark })
			},
			setStatusBarStyleLight: async () => {
				if (!this.isAppCapacitor()) {
					console.warn("[App] setStatusBarStyleLight is not supported on this platform")
					return false
				}
				return await StatusBar.setStyle({ style: Style.Light })
			},
			hideStatusBar: async () => {
				if (!this.isAppCapacitor()) {
					console.warn("[App] hideStatusBar is not supported on this platform")
					return false
				}
				return await StatusBar.hide()
			},
			showStatusBar: async () => {
				if (!this.isAppCapacitor()) {
					console.warn("[App] showStatusBar is not supported on this platform")
					return false
				}
				return await StatusBar.show()
			},
			isAppCapacitor: this.isAppCapacitor,
		}
	}

	static appContext() {
		return {
			renderRef: this.renderRef,
			sessionController: this.sessionController,
			userController: this.userController,
		}
	}

	static staticRenders = {
		NotFound: (props) => {
			return <NotFound />
		},
		RenderError: (props) => {
			return <RenderError {...props} />
		},
		Crash: Crash,
		initialization: () => {
			return <Splash.SplashComponent logo={config.logo.alt} />
		}
	}

	sessionController = new Session()
	userController = new User()
	state = {
		session: null,
		user: null,
	}

	flushState = async () => {
		await this.setState({ session: null, user: null })
	}

	componentDidMount = async () => {
		if (this.isAppCapacitor()) {
			window.addEventListener("statusTap", () => {
				this.eventBus.emit("statusTap")
			})

			StatusBar.setOverlaysWebView({ overlay: true })
			window.app.hideStatusBar()
		}

		this.eventBus.emit("render_initialization")

		await this.initialization()

		this.eventBus.emit("render_initialization_done")
	}

	initialization = async () => {
		console.debug(`[App] Initializing app`)

		const initializationTasks = [
			async () => {
				try {
					await this.contexts.app.attachAPIConnection()
				} catch (error) {
					throw {
						cause: "Cannot connect to API",
						details: error.message,
					}
				}
			},
			async () => {
				try {
					await this.__SessionInit()
				} catch (error) {
					throw {
						cause: "Cannot initialize session",
						details: error.message,
					}
				}
			},
			async () => {
				try {
					await this.__UserInit()
				} catch (error) {
					throw {
						cause: "Cannot initialize user data",
						details: error.message,
					}
				}
			},
			async () => {
				try {
					await this.__WSInit()
				} catch (error) {
					throw {
						cause: "Cannot connect to WebSocket",
						details: error.message,
					}
				}
			},
		]

		await Promise.tasked(initializationTasks).catch((reason) => {
			console.error(`[App] Initialization failed: ${reason.cause}`)
			window.app.eventBus.emit("crash", reason.cause, reason.details)
		})
	}

	__SessionInit = async () => {
		const token = await Session.token

		if (!token || token == null) {
			window.app.eventBus.emit("forceToLogin")
			return false
		}

		const session = await this.sessionController.getCurrentSession().catch((error) => {
			console.error(`[App] Cannot get current session: ${error.message}`)
			return false
		})

		await this.setState({ session })
	}

	__WSInit = async () => {
		if (!this.state.session) {
			return false
		}

		const token = await Session.token
		await this.contexts.app.attachWSConnection()

		this.mainSocket.emit("authenticate", token)
	}

	__UserInit = async () => {
		if (!this.state.session) {
			return false
		}

		const user = await User.data()
		await this.setState({ user })
	}

	render() {
		return (
			<React.Fragment>
				<Helmet>
					<title>{config.app.siteName}</title>
				</Helmet>
				<antd.ConfigProvider>
					<Layout user={this.state.user} >
						<BindPropsProvider
							user={this.state.user}
							session={this.state.session}
						>
							<Render.RouteRender staticRenders={App.staticRenders} />
						</BindPropsProvider>
					</Layout>
				</antd.ConfigProvider>
			</React.Fragment>
		)
	}
}

export default CreateEviteApp(App, {
	extensions: [
		SettingsController,
		i18n.extension,
		Sound.extension,
		Notifications.extension,
		API,
		Render.extension,
		Theme.extension,
		SplashExtension,
	],
})