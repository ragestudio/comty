// Patch global prototypes
import { Buffer } from "buffer"

window.Buffer = Buffer

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

import Splash from "./splash"

import { EviteRuntime } from "evite"
import { Helmet } from "react-helmet"
import * as antd from "antd"
import { Toast } from "antd-mobile"
import { BrowserRouter } from "react-router-dom"
import { StatusBar, Style } from "@capacitor/status-bar"
import { App as CapacitorApp } from "@capacitor/app"
import { Translation } from "react-i18next"
import { Lightbox } from "react-modal-image"
import loadable from "@loadable/component"

import SessionModel from "models/session"
import UserModel from "models/user"

import config from "config"
import * as Utils from "./utils"

import {
	NotFound,
	RenderError,
	Crash,
	Navigation,
	Login,
	UserRegister,
	Searcher,
	NotificationsCenter,
	PostViewer,
	PostCreatorModal,
} from "components"
import { DOMWindow } from "components/RenderWindow"

import { Icons } from "components/Icons"

import { ThemeProvider } from "cores/style/style.core.jsx"

import Layout from "./layout"
import * as Router from "./router"

import "theme/index.less"

class ComtyApp extends React.Component {
	constructor(props) {
		super(props)

		Object.keys(this.eventsHandlers).forEach((event) => {
			app.eventBus.on(event, this.eventsHandlers[event])
		})
	}

	sessionController = new SessionModel()
	userController = new UserModel()

	state = {
		session: null,
		initialized: false,
	}

	static splashAwaitEvent = "app.initialization.finish"

	static async initialize() {
		window.app.version = config.package.version

		window.localStorage.setItem("last_version", window.app.version)

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
	}

	static publicEvents = {
		"clearAllOverlays": function () {
			window.app.DrawerController.closeAll()
		},
	}

	static publicMethods = {
		controls: {
			openLoginForm: async (options = {}) => {
				app.DrawerController.open("login", Login, {
					defaultLocked: options.defaultLocked ?? false,
					componentProps: {
						sessionController: this.sessionController,
					}
				})
			},
			openRegisterForm: async () => {
				app.DrawerController.open("Register", UserRegister, {
					allowMultiples: false,
					panel: true,
				})
			},
			// Opens the notification window and sets up the UI for the notification to be displayed
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
				app.cores.sound.useUIAudio("navigation.search")

				window.app.ModalController.open((props) => <Searcher renderResults {...props} />)
			},
			openNavigationMenu: () => window.app.DrawerController.open("navigation", Navigation),
			openFullImageViewer: (src) => {
				const win = new DOMWindow({
					id: "fullImageViewer",
					className: "fullImageViewer",
				})

				win.render(<Lightbox
					small={src}
					large={src}
					onClose={() => win.remove()}
					hideDownload
					showRotate
				/>)
			},
			openPostViewer: (post) => {
				const win = new DOMWindow({
					id: "postViewer",
					className: "postViewer",
				})

				win.render(<PostViewer post={post} />)
			},
			openPostCreator: () => {
				const win = new DOMWindow({
					id: "postCreator",
					className: "postCreator",
				})

				win.render(<PostCreatorModal
					onClose={() => win.destroy()}
				/>)
			}
		},
		navigation: {
			reload: () => {
				window.location.reload()
			},
			softReload: () => {
				app.eventBus.emit("app.softReload")
			},
			goAuth: () => {
				return app.setLocation(config.app.authPath ?? "/auth")
			},
			goMain: () => {
				return app.setLocation(config.app.mainPath ?? "/home")
			},
			goToSettings: (setting_id) => {
				app.cores.sound.useUIAudio("navigation.settings")

				return app.setLocation(`/settings`, {
					query: {
						setting: setting_id
					}
				})
			},
			goToAccount: (username) => {
				if (!username) {
					if (!app.userData) {
						console.error("Cannot go to account, no username provided and no user logged in")
						return false
					}

					username = app.userData.username
				}

				return app.setLocation(`/account/${username}`)
			},
			goToPost: (post_id) => {
				return app.setLocation(`/post/${post_id}`)
			},
		},
		electron: {
			closeApp: () => {
				if (window.isElectron) {
					window.electron.ipcRenderer.invoke("app.close")
				}
			},
			minimizeApp: () => {
				if (window.isElectron) {
					window.electron.ipcRenderer.invoke("app.minimize")
				}
			},
		},
		capacitor: {
			isAppCapacitor: () => window.navigator.userAgent === "capacitor",
			setStatusBarStyleDark: async () => {
				if (!window.app.capacitor.isAppCapacitor()) {
					console.warn("[App] setStatusBarStyleDark is only available on capacitor")
					return false
				}
				return await StatusBar.setStyle({ style: Style.Dark })
			},
			setStatusBarStyleLight: async () => {
				if (!window.app.capacitor.isAppCapacitor()) {
					console.warn("[App] setStatusBarStyleLight is not supported on this platform")
					return false
				}
				return await StatusBar.setStyle({ style: Style.Light })
			},
			hideStatusBar: async () => {
				if (!window.app.capacitor.isAppCapacitor()) {
					console.warn("[App] hideStatusBar is not supported on this platform")
					return false
				}

				return await StatusBar.hide()
			},
			showStatusBar: async () => {
				if (!window.app.capacitor.isAppCapacitor()) {
					console.warn("[App] showStatusBar is not supported on this platform")
					return false
				}
				return await StatusBar.show()
			},
		},
		openDebugger: () => {
			// create a new dom window
			const win = new DOMWindow({
				id: "debug",
				title: "Debug",
			})

			win.createDefaultWindow(loadable(() => import("./debug")), {
				width: 700,
				height: 500,
			})
		},
		clearInternalStorage: async () => {
			antd.Modal.confirm({
				title: "Clear internal storage",
				content: "Are you sure you want to clear all internal storage? This will remove all your data from the app, including your session.",
				onOk: async () => {
					Utils.deleteInternalStorage()
				}
			})
		},
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
		Initialization: Splash,
	}

	eventsHandlers = {
		"app.softReload": () => {
			this.forceUpdate()

			app.eventBus.emit("layout.forceUpdate")
			app.eventBus.emit("router.forceUpdate")
		},
		"app.no_session": async () => {
			const location = window.location.pathname

			if (location !== "/" && location !== "/login" && location !== "/register") {
				antd.notification.info({
					message: "You are not logged in, to use some features you will need to log in.",
					btn: <antd.Button type="primary" onClick={() => app.goAuth()}>Login</antd.Button>,
					duration: 15,
				})
			}
		},
		"auth:login_success": async () => {
			app.eventBus.emit("layout.animations.fadeOut")

			await this.initialization()

			app.cores.api.reconnectWebsockets()

			app.navigation.goMain()

			app.eventBus.emit("layout.animations.fadeIn")
		},
		"auth:logout_success": async () => {
			app.navigation.goAuth()
			await this.flushState()
		},
		"session.invalid": async (error) => {
			const token = await SessionModel.token

			if (!this.state.session && !token) {
				return false
			}

			await SessionModel.destroyCurrentSession()
			await this.flushState()

			app.navigation.goAuth()

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

			if (this.wsReconnectingTry > 3 && app.cores.settings.get("app.reloadOnWSConnectionError")) {
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
		},
		"devtool-opened": () => {
			// show warning
			antd.notification.open({
				message: <Translation>
					{(t) => t("Devtool opened")}
				</Translation>,
				description: <Translation>
					{(t) => t("You have opened the devtool for the first time, please be aware that this is a security risk and you should close it as soon as possible.")}
				</Translation>,
				icon: <Icons.MdOutlineWarning />,
			})
		}
	}

	flushState = async () => {
		await this.setState({ session: null, user: null })
	}

	componentDidMount = async () => {
		if (app.capacitor.isAppCapacitor()) {
			window.addEventListener("statusTap", () => {
				app.eventBus.emit("statusTap")
			})

			StatusBar.setOverlaysWebView({ overlay: true })

			CapacitorApp.addListener("backButton", ({ canGoBack }) => {
				if (!canGoBack) {
					CapacitorApp.exitApp()
				} else {
					window.history.back()
				}
			})
		}

		//app.cores.sound.useUIAudio("splash_out")

		app.eventBus.emit("app.initialization.start")

		await this.initialization()

		app.eventBus.emit("app.initialization.finish")

		this.setState({ initialized: true })

		Utils.handleOpenDevTools()
	}

	onRuntimeStateUpdate = (state) => {
		console.debug(`[App] Runtime state updated`, state)
	}

	initialization = async () => {
		console.debug(`[App] Initializing app`)

		const initializationTasks = [
			async () => {
				try {
					await this.__SessionInit()
					await this.__UserInit()

					app.eventBus.emit("app.initialization.session_success")
				} catch (error) {
					app.eventBus.emit("app.initialization.session_error", error)

					console.error(`[App] Error while initializing session`, error)

					throw {
						cause: "Cannot initialize session",
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
		const token = await SessionModel.token

		if (!token || token == null) {
			app.eventBus.emit("app.no_session")
			return false
		}

		const session = await SessionModel.getCurrentSession().catch((error) => {
			console.error(`[App] Cannot get current session: ${error.message}`)
			return false
		})

		await this.setState({ session })
	}

	__UserInit = async () => {
		if (!this.state.session) {
			return false
		}

		const user = await UserModel.data()

		app.userData = user

		this.setState({ user })
	}

	render() {
		if (!this.state.initialized) {
			return <div>
				<h1>
					App is initializing...
				</h1>
			</div>
		}

		return <React.Fragment>
			<Helmet>
				<title>{config.app.siteName}</title>
				<meta name="og:description" content={config.app.siteDescription} />
				<meta property="og:title" content={config.app.siteName} />
			</Helmet>
			<BrowserRouter>
				<ThemeProvider>
					<Layout
						user={this.state.user}
						staticRenders={ComtyApp.staticRenders}
						bindProps={{
							staticRenders: ComtyApp.staticRenders,
							user: this.state.user,
							session: this.state.session,
							sessionController: this.sessionController,
							userController: this.userController,
						}}
					>
						<Router.PageRender />
					</Layout>
				</ThemeProvider>
			</BrowserRouter>
		</React.Fragment>
	}
}

export default new EviteRuntime(ComtyApp)