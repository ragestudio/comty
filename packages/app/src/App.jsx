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
import { Translation } from "react-i18next"
import { Lightbox } from "react-modal-image"

import { StatusBar, Style } from "@capacitor/status-bar"
import { App as CapacitorApp } from "@capacitor/app"
import { CapacitorUpdater } from "@capgo/capacitor-updater"

import AuthModel from "models/auth"
import SessionModel from "models/session"
import UserModel from "models/user"

import config from "config"
import * as Utils from "./utils"

import {
	NotFound,
	RenderError,
	Crash,
	Login,
	UserRegister,
	Searcher,
	NotificationsCenter,
	PostCreator,
} from "components"
import { DOMWindow } from "components/RenderWindow"

import { Icons } from "components/Icons"

import { ThemeProvider } from "cores/style/style.core.jsx"

import Layout from "./layout"
import * as Router from "./router"

import * as Sentry from "@sentry/browser"

import "theme/index.less"

CapacitorUpdater.notifyAppReady()

class ComtyApp extends React.Component {
	constructor(props) {
		super(props)

		Object.keys(this.eventsHandlers).forEach((event) => {
			app.eventBus.on(event, this.eventsHandlers[event])
		})
	}

	state = {
		session: null,
		initialized: false,
	}

	static splashAwaitEvent = "app.initialization.finish"
	static async initialize() {
		window.app.version = config.package.version
		window.app.confirm = antd.Modal.confirm
		window.app.message = antd.message
		window.app.isCapacitor = window.navigator.userAgent === "capacitor"

		if (window.app.version !== window.localStorage.getItem("last_version")) {
			app.message.info(`Comty has been updated to version ${window.app.version}!`)
			window.localStorage.setItem("last_version", window.app.version)
		}

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

		console.log(import.meta.env)

		if (import.meta.env.VITE_SENTRY_DSN) {
			console.log(`Initializing Sentry...`)

			Sentry.init({
				debug: true,
				dsn: import.meta.env.VITE_SENTRY_DSN,
				release: "comty-web-app",
			})
		}
	}

	static publicEvents = {
		"clearAllOverlays": function () {
			window.app.DrawerController.closeAll()
		},
	}

	static publicMethods = {
		controls: {
			toggleUIVisibility: (to) => {
				if (app.layout.sidebar) {
					app.layout.sidebar.toggleVisibility(to)
				}

				if (app.layout.tools_bar) {
					app.layout.tools_bar.toggleVisibility(to)
				}

				if (app.layout.top_bar) {
					app.layout.top_bar.toggleVisibility(to)
				}

				if (app.layout.floatingStack) {
					app.layout.floatingStack.toggleGlobalVisibility(to)
				}
			},
			openLoginForm: async (options = {}) => {
				app.DrawerController.open("login", Login, {
					defaultLocked: options.defaultLocked ?? false,
					componentProps: {
						sessionController: this.sessionController,
					},
					props: {
						fillEnd: true,
						bodyStyle: {
							height: "100%",
						}
					}
				})
			},
			openRegisterForm: async (options = {}) => {
				app.DrawerController.open("Register", UserRegister, {
					defaultLocked: options.defaultLocked ?? false,
					componentProps: {
						sessionController: this.sessionController,
					},
					props: {
						bodyStyle: {
							height: "100%",
						}
					},
				})
			},
			// Opens the notification window and sets up the UI for the notification to be displayed
			openNotifications: () => {
				window.app.layout.sidedrawer.open("notifications", NotificationsCenter, {
					props: {
						width: "fit-content",
					},
					allowMultiples: false,
					escClosable: true,
				})
			},
			openSearcher: (options) => {
				app.cores.sound.useUIAudio("navigation.search")

				if (app.isMobile) {
					return app.DrawerController.open("searcher", Searcher, {
						...options,
						componentProps: {
							renderResults: true,
							autoFocus: true,
						}
					})
				}

				return app.layout.modal.open("searcher", (props) => <Searcher autoFocus renderResults {...props} />, {
					framed: false
				})
			},
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

			openPostCreator: () => {
				app.layout.modal.open("post_creator", (props) => <PostCreator {...props} />, {
					framed: false
				})
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
				return app.location.push(config.app.authPath ?? "/auth")
			},
			goMain: () => {
				return app.location.push(config.app.mainPath ?? "/home")
			},
			goToMusic: () => {
				return app.location.push("/music")
			},
			goToSettings: (setting_id) => {
				app.cores.sound.useUIAudio("navigation.settings")

				return app.location.push(`/settings`, {
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

				return app.location.push(`/account/${username}`)
			},
			goToPost: (post_id) => {
				return app.location.push(`/post/${post_id}`)
			},
			goToPlaylist: (playlist_id) => {
				return app.location.push(`/play/${playlist_id}`)
			}
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
		"app.logout_request": () => {
			antd.Modal.confirm({
				title: "Logout",
				content: "Are you sure you want to logout?",
				onOk: () => {
					AuthModel.logout()
				},
			})
		},
		"app.no_session": async () => {
			const location = window.location.pathname

			if (location !== "/" && location !== "/auth" && location !== "/register") {
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
			app.cores.api.disconnectWebsockets()

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
		delete app.userData
		await this.setState({ session: null, user: null })
	}

	componentDidMount = async () => {
		if (app.isCapacitor) {
			window.addEventListener("statusTap", () => {
				app.eventBus.emit("statusTap")
			})

			StatusBar.setOverlaysWebView({ overlay: false })

			CapacitorApp.addListener("backButton", ({ canGoBack }) => {
				if (!canGoBack) {
					CapacitorApp.exitApp()
				} else {
					app.location.back()
				}
			})
		}

		await this.initialization()

		app.cores.sound.useUIAudio("splash_out")

		this.setState({ initialized: true })

		Utils.handleOpenDevTools()
	}

	onRuntimeStateUpdate = (state) => {
		console.debug(`[App] Runtime state updated`, state)
	}

	initialization = async () => {
		app.eventBus.emit("app.initialization.start")

		console.debug(`[App] Initializing app`)

		const initializationTasks = [
			async () => {
				try {
					await this.__SessionInit()
				} catch (error) {
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

		app.eventBus.emit("app.initialization.finish")
	}

	__SessionInit = async () => {
		const token = await SessionModel.token

		if (!token || token == null) {
			app.eventBus.emit("app.no_session")
			return false
		}

		const user = await UserModel.data().catch((err) => {
			return false
		})

		if (!user) {
			app.eventBus.emit("app.no_session")
			return false
		}

		app.userData = user

		await this.setState({
			user
		})
	}

	render() {
		return <React.Fragment>
			<Helmet>
				<title>{config.app.siteName}</title>
				<meta name="og:description" content={config.app.siteDescription} />
				<meta property="og:title" content={config.app.siteName} />
			</Helmet>
			<Router.InternalRouter>
				<ThemeProvider>
					<Layout
						user={this.state.user}
						staticRenders={ComtyApp.staticRenders}
						bindProps={{
							user: this.state.user,
						}}
					>
						{
							this.state.initialized && <Router.PageRender />
						}
					</Layout>
				</ThemeProvider>
			</Router.InternalRouter>
		</React.Fragment>
	}
}

export default new EviteRuntime(ComtyApp)