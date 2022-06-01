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
import { EviteRuntime } from "evite"
import { Helmet } from "react-helmet"
import * as antd from "antd"
import { Toast } from "antd-mobile"
import { StatusBar, Style } from "@capacitor/status-bar"
import { Translation } from "react-i18next"

import { Session, User } from "models"
import config from "config"

import { NotFound, RenderError, Crash, Settings, Navigation, Login } from "components"
import { Icons } from "components/Icons"

import Layout from "./layout"
import Router from "./router"

import "theme/index.less"

class App extends React.Component {
	sessionController = new Session()

	userController = new User()

	state = {
		session: null,
		user: null,
	}

	static initialize() {
		window.app.version = config.package.version
	}

	static publicEvents = {
		"clearAllOverlays": function () {
			window.app.DrawerController.closeAll()
		},
	}

	eventsHandlers = {
		"app.createLogin": async () => {
			app.DrawerController.open("login", Login, {
				componentProps: {
					sessionController: this.sessionController
				}
			})
		},
		"session.logout": async () => {
			await this.sessionController.logout()
		},
		"new_session": async () => {
			await this.flushState()
			await this.initialization()

			if (window.location.pathname == "/login") {
				window.app.setLocation(this.beforeLoginLocation ?? "/main")
				this.beforeLoginLocation = null
			}
		},
		"destroyed_session": async () => {
			await this.flushState()
			app.eventBus.emit("forceToLogin")
		},
		"forceToLogin": () => {
			app.setLocation("/main")
			app.eventBus.emit("app.createLogin")
		},
		"invalid_session": async (error) => {
			const token = await Session.token

			if (!this.state.session && !token) {
				return false
			}

			await this.sessionController.forgetLocalSession()
			await this.flushState()

			app.eventBus.emit("forceToLogin")

			antd.notification.open({
				message: <Translation>
					{(t) => t("Invalid Session")}
				</Translation>,
				description: <Translation>
					{(t) => t(error)}
				</Translation>,
				icon: <Icons.MdOutlineAccessTimeFilled />,
			})
		},
		"no_session": async () => {
			app.eventBus.emit("forceToLogin")
		},
		"websocket_connected": () => {
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
		"websocket_connection_error": () => {
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

			if (this.wsReconnectingTry > 3 && app.settings.get("app.reloadOnWSConnectionError")) {
				window.location.reload()
			}
		},
		"websocket_latency_too_high": () => {
			if (!this.latencyWarning) {
				this.latencyWarning = true

				Toast.show({
					icon: "loading",
					content: "Slow connection...",
					duration: 0,
				})
			}
		},
		"websocket_latency_normal": () => {
			if (this.latencyWarning) {
				this.latencyWarning = null

				Toast.show({
					icon: "success",
					content: "Connection restored",
				})
			}
		},
	}

	static staticRenders = {
		NotFound: (props) => {
			return <NotFound />
		},
		RenderError: (props) => {
			return <RenderError {...props} />
		},
		Crash: Crash.CrashWrapper,
		Initialization: () => {
			return <div className="splash_wrapper">
				<div className="splash_logo">
					<img src={config.logo.alt} />
				</div>
				<div className="splash_label">
					<Icons.LoadingOutlined />
				</div>
			</div>
		}
	}

	static publicMethods = {
		openSettings: (goTo) => {
			window.app.SidedrawerController.open("Settings", Settings, {
				props: {
					width: "fit-content",
					goTo,
				},
				allowMultiples: false,
				escClosable: true,
			})
		},
		openNavigationMenu: () => window.app.DrawerController.open("navigation", Navigation),
		goMain: () => {
			return window.app.setLocation(config.app.mainPath)
		},
		goToAccount: (username) => {
			return window.app.setLocation(`/account`, { username })
		},
		isAppCapacitor: () => window.navigator.userAgent === "capacitor",
		setStatusBarStyleDark: async () => {
			if (!window.app.isAppCapacitor()) {
				console.warn("[App] setStatusBarStyleDark is only available on capacitor")
				return false
			}
			return await StatusBar.setStyle({ style: Style.Dark })
		},
		setStatusBarStyleLight: async () => {
			if (!window.app.isAppCapacitor()) {
				console.warn("[App] setStatusBarStyleLight is not supported on this platform")
				return false
			}
			return await StatusBar.setStyle({ style: Style.Light })
		},
		hideStatusBar: async () => {
			if (!window.app.isAppCapacitor()) {
				console.warn("[App] hideStatusBar is not supported on this platform")
				return false
			}
			return await StatusBar.hide()
		},
		showStatusBar: async () => {
			if (!window.app.isAppCapacitor()) {
				console.warn("[App] showStatusBar is not supported on this platform")
				return false
			}
			return await StatusBar.show()
		},
	}

	constructor(props) {
		super(props)

		Object.keys(this.eventsHandlers).forEach((event) => {
			app.eventBus.on(event, this.eventsHandlers[event])
		})
	}

	flushState = async () => {
		await this.setState({ session: null, user: null })
	}

	componentDidMount = async () => {
		if (window.app.isAppCapacitor()) {
			window.addEventListener("statusTap", () => {
				app.eventBus.emit("statusTap")
			})

			StatusBar.setOverlaysWebView({ overlay: true })
			window.app.hideStatusBar()
		}

		const userAgentPlatform = window.navigator.userAgent.toLowerCase()

		if (userAgentPlatform.includes("mac")) {
			this.props.cores.ShortcutsCore.register({
				key: ",",
				meta: true,
				preventDefault: true,
			}, (...args) => {
				App.publicMethods.openSettings(...args)
			})
		} else {
			this.props.cores.ShortcutsCore.register({
				key: ",",
				ctrl: true,
				preventDefault: true,
			}, (...args) => {
				App.publicMethods.openSettings(...args)
			})
		}

		app.eventBus.emit("app.initialization.start")

		await this.initialization()

		app.eventBus.emit("app.initialization.finish")
	}

	initialization = async () => {
		console.debug(`[App] Initializing app`)

		const initializationTasks = [
			async () => {
				try {
					await this.props.cores.ApiCore.attachAPIConnection()

					app.eventBus.emit("app.initialization.api_success")
				} catch (error) {
					app.eventBus.emit("app.initialization.api_error", error)

					throw {
						cause: "Cannot connect to API",
						details: error.stack,
					}
				}
			},
			async () => {
				try {
					await this.__SessionInit()

					app.eventBus.emit("app.initialization.session_success")
				} catch (error) {
					app.eventBus.emit("app.initialization.session_error", error)

					throw {
						cause: "Cannot initialize session",
						details: error.message,
					}
				}
			},
			async () => {
				try {
					await this.__UserInit()

					app.eventBus.emit("app.initialization.user_success")
				} catch (error) {
					app.eventBus.emit("app.initialization.user_error", error)

					throw {
						cause: "Cannot initialize user data",
						details: error.message,
					}
				}
			},
			async () => {
				try {
					await this.__WSInit()

					app.eventBus.emit("app.initialization.ws_success")
				} catch (error) {
					app.eventBus.emit("app.initialization.ws_error", error)

					throw {
						cause: "Cannot connect to WebSocket",
						details: error.message,
					}
				}
			},
		]

		await Promise.tasked(initializationTasks).catch((reason) => {
			console.error(`[App] Initialization failed: ${reason.cause}`)
			app.eventBus.emit("runtime.crash", {
				message: `App initialization failed (${reason.cause})`,
				details: reason.details,
			})
		})
	}

	__SessionInit = async () => {
		const token = await Session.token

		if (!token || token == null) {
			window.app.eventBus.emit("no_session")
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

		await this.props.cores.ApiCore.attachWSConnection()
	}

	__UserInit = async () => {
		if (!this.state.session) {
			return false
		}

		const user = await User.data()
		await this.setState({ user })
	}

	render() {
		return <React.Fragment>
			<Helmet>
				<title>{config.app.siteName}</title>
			</Helmet>
			<antd.ConfigProvider>
				<Layout
					user={this.state.user}
					staticRenders={App.staticRenders}
					bindProps={{
						staticRenders: App.staticRenders,
						user: this.state.user,
						session: this.state.session,
						sessionController: this.sessionController,
						userController: this.userController,
					}}
				>
					<Router />
				</Layout>
			</antd.ConfigProvider>
		</React.Fragment>
	}
}

export default new EviteRuntime(App)