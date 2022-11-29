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

String.prototype.toBoolean = function () {
	return this === "true"
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
import ReactDOM from "react-dom"

import { EviteRuntime } from "evite"
import { Helmet } from "react-helmet"
import * as antd from "antd"
import { Toast } from "antd-mobile"
import { StatusBar, Style } from "@capacitor/status-bar"
import { App as CapacitorApp } from "@capacitor/app"
import { Translation } from "react-i18next"

import { Session, User } from "models"
import config from "config"
import * as Utils from "./utils"

import { NotFound, RenderError, Crash, Settings, Navigation, Login, UserRegister, Creator, Searcher, NotificationsCenter } from "components"
import { DOMWindow } from "components/RenderWindow"
import loadable from "@loadable/component"

import { Icons } from "components/Icons"

import Layout from "./layout"
import * as Router from "./router"

import "theme/index.less"

class App extends React.Component {
	sessionController = new Session()

	userController = new User()

	state = {
		session: null,
		user: null,
	}

	static async initialize() {
		window.app.version = config.package.version

		window.app.message = antd.message

		// check if electron library is available
		if (typeof window.electron !== "undefined") {
			window.isElectron = true
		}

		// if is electron app, append frame to body as first child
		if (window.isElectron) {
			const frame = document.createElement("div")
			const systemBarComponent = await import("components/Layout/systemBar")

			frame.id = "systemBar"

			ReactDOM.render(<systemBarComponent.default />, frame)

			document.body.insertBefore(frame, document.body.firstChild)

			// append var to #root
			document.getElementById("root").classList.add("electron")
		}

		if (this.publicMethods.isAppCapacitor()) {
			// prevent back button to close app
			CapacitorApp.addListener('backButton', ({ canGoBack }) => {
				if (!canGoBack) {
					CapacitorApp.exitApp();
				} else {
					window.history.back();
				}
			});
		}
	}

	static publicEvents = {
		"clearAllOverlays": function () {
			window.app.DrawerController.closeAll()
		},
	}

	eventsHandlers = {
		"app.close": () => {
			if (window.isElectron) {
				window.electron.ipcRenderer.invoke("app.close")
			}
		},
		"app.minimize": () => {
			if (window.isElectron) {
				window.electron.ipcRenderer.invoke("app.minimize")
			}
		},
		"app.reload": () => {
			window.location.reload()
		},
		"app.softReload": () => {
			this.forceUpdate()

			app.eventBus.emit("layout.forceUpdate")
			app.eventBus.emit("router.forceUpdate")
		},
		"app.openSearcher": () => {
			App.publicMethods.openSearcher()
		},
		"app.openCreator": () => {
			App.publicMethods.openCreator()
		},
		"app.openNotifications": () => {
			App.publicMethods.openNotifications()
		},
		"app.createLogin": async (options = {}) => {
			app.DrawerController.open("login", Login, {
				defaultLocked: options.defaultLocked ?? false,
				componentProps: {
					sessionController: this.sessionController,
					onDone: () => {
						app.goMain()
					}
				}
			})
		},
		"app.createRegister": async () => {
			app.DrawerController.open("Register", UserRegister, {
				allowMultiples: false,
				panel: true,
			})
		},
		"app.no_session": async () => {
			const location = window.location.pathname

			if (location !== "/login" && location !== "/register") {
				antd.notification.info({
					message: "You are not logged in, to use some features you will need to log in.",
					btn: <antd.Button type="primary" onClick={() => app.goAuth()}>Login</antd.Button>,
					duration: 15,
				})
			}
		},
		"app.clearInternalStorage": async () => {
			antd.Modal.confirm({
				title: "Clear internal storage",
				content: "Are you sure you want to clear all internal storage? This will remove all your data from the app, including your session.",
				onOk: async () => {
					Utils.deleteInternalStorage()
				}
			})
		},
		"session.logout": async () => {
			await this.sessionController.logout()
		},
		"session.created": async () => {
			app.eventBus.emit("layout.animations.fadeOut")
			app.eventBus.emit("layout.render.lock")

			await this.flushState()
			await this.initialization()

			// if is `/login` move to `/`
			if (window.location.pathname === "/login") {
				app.setLocation("/")
			}

			app.eventBus.emit("layout.render.unlock")
			app.eventBus.emit("layout.animations.fadeIn")
		},
		"session.destroyed": async () => {
			await this.flushState()
			app.eventBus.emit("app.forceToLogin")
		},
		"session.regenerated": async () => {
			//await this.flushState()
			//await this.initialization()
		},
		"session.invalid": async (error) => {
			const token = await Session.token

			if (!this.state.session && !token) {
				return false
			}

			await this.sessionController.forgetLocalSession()
			await this.flushState()

			app.eventBus.emit("app.forceToLogin")

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
		"app.forceToLogin": () => {
			window.app.setLocation("/login")
		},
		"api.ws.main.connect": () => {
			if (this.wsReconnecting) {
				this.wsReconnectingTry = 0
				this.wsReconnecting = false

				setTimeout(() => {
					Toast.show({
						icon: "success",
						content: "Connected",
					})
				}, 500)
			}
		},
		"api.ws.main.connect_error": () => {
			if (!this.wsReconnecting) {
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
		"api.ws.main.disconnect": () => {
			antd.notification.open({
				message: <Translation>
					{(t) => t("Disconnected")}
				</Translation>,
				description: <Translation>
					{(t) => t("You have been disconnected from the server, trying to reconnect.")}
				</Translation>
			})
		}
	}

	static staticRenders = {
		PageLoad: () => {
			return <antd.Skeleton active />
		},
		NotFound: (props) => {
			return <NotFound />
		},
		RenderError: (props) => {
			return <RenderError {...props} />
		},
		Crash: Crash.CrashWrapper,
		Initialization: () => {
			return <div className="app_splash_wrapper">
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
		openNotifications: () => {
			window.app.SidedrawerController.open("notifications", NotificationsCenter, {
				props: {
					width: "fit-content",
				},
				allowMultiples: false,
				escClosable: true,
			})
		},
		openSearcher: (options) => {
			window.app.ModalController.open((props) => <Searcher {...props} />)
		},
		openCreator: () => {
			if (window.isMobile) {
				return app.DrawerController.open("creator", Creator, {
					allowMultiples: false,
					escClosable: true,
				})
			}

			return window.app.ModalController.open((props) => <Creator {...props} />)
		},
		openSettings: (goTo) => {
			const controller = window.isMobile ? app.DrawerController : app.SidedrawerController

			if (!controller) {
				console.error("No controller found")
				return false
			}

			controller.open("Settings", Settings, {
				props: {
					width: "fit-content",
					goTo,
				},
				allowMultiples: false,
				escClosable: true,
			})
		},
		openNavigationMenu: () => window.app.DrawerController.open("navigation", Navigation),
		goAuth: () => {
			return window.app.setLocation(config.app.authPath ?? "/auth")
		},
		goMain: () => {
			return window.app.setLocation(config.app.mainPath ?? "/home")
		},
		goToAccount: (username) => {
			if (!username) {
				if (!app.userData) {
					console.error("Cannot go to account, no username provided and no user logged in")
					return false
				}

				username = app.userData.username
			}

			return window.app.setLocation(`/@${username}`)
		},
		goToPost: (id) => {
			return window.app.setLocation(`/post/${id}`)
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
		openDebugger: () => {
			// create a new dom window
			const win = new DOMWindow({
				id: "debug",
				title: "Debug",
			})

			win.createDefaultWindow(loadable(() => import("./debug")))
		}
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
			//window.app.hideStatusBar()
		}

		const userAgentPlatform = window.navigator.userAgent.toLowerCase()
		const isMac = userAgentPlatform.indexOf("mac") !== -1

		this.props.cores.ShortcutsCore.register({
			id: "app.openSearcher",
			key: ",",
			meta: isMac,
			ctrl: !isMac,
			preventDefault: true,
		}, (...args) => {
			App.publicMethods.openSettings(...args)
		})

		this.props.cores.ShortcutsCore.register({
			id: "app.openCreator",
			key: "k",
			meta: isMac,
			ctrl: !isMac,
			preventDefault: true,
		}, () => {
			App.publicMethods.openCreator()
		})

		app.eventBus.emit("app.initialization.start")

		await this.initialization()

		app.eventBus.emit("app.initialization.finish")
	}

	initialization = async () => {
		console.debug(`[App] Initializing app`)

		const initializationTasks = [
			async () => {
				try {
					// get remotes origins from config
					const defaultRemotes = config.remotes

					// get storaged	remotes origins
					const storedRemotes = await app.settings.get("remotes") ?? {}

					// mount main api bridge
					await this.props.cores.ApiCore.attachBridge("main", {
						origin: storedRemotes.mainApi ?? defaultRemotes.mainApi,
						locked: true,
					})

					await this.props.cores.ApiCore.namespaces["main"].initialize()

					app.eventBus.emit("app.initialization.api_success")
				} catch (error) {
					app.eventBus.emit("app.initialization.api_error", error)
					console.error(`[App] Error while initializing api`, error)

					throw {
						cause: "Cannot connect to API",
						details: `Sorry but we cannot connect to the API. Please try again later. [${config.remotes.mainApi}]`,
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
			app.eventBus.emit("app.no_session")
			return false
		}

		const session = await this.sessionController.getCurrentSession().catch((error) => {
			console.error(`[App] Cannot get current session: ${error.message}`)
			return false
		})

		await this.setState({ session })
	}

	__UserInit = async () => {
		if (!this.state.session) {
			return false
		}

		const user = await User.data()

		await this.setState({ user })

		const publicData = await User.publicData()

		app.userData = {
			...publicData,
		}
	}

	render() {
		return <React.Fragment>
			<Helmet>
				<title>{config.app.siteName}</title>
				<meta name="og:description" content={config.app.siteDescription} />
				<meta property="og:title" content={config.app.siteName} />
			</Helmet>
			<antd.ConfigProvider>
				<Router.InternalRouter>
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
						<Router.PageRender />
					</Layout>
				</Router.InternalRouter>
			</antd.ConfigProvider>
		</React.Fragment>
	}
}

export default new EviteRuntime(App)
