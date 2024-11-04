import "./patches"
import config from "@config"

import React from "react"
import { Runtime } from "vessel"
import { Helmet } from "react-helmet"
import { Translation } from "react-i18next"
import * as Sentry from "@sentry/browser"
import { invoke } from "@tauri-apps/api/tauri"
import { Lightbox } from "react-modal-image"
import * as antd from "antd"

import { StatusBar, Style } from "@capacitor/status-bar"
import { App as CapacitorApp } from "@capacitor/app"
import { CapacitorUpdater } from "@capgo/capacitor-updater"

import AppsMenu from "@components/AppMenu"

import AuthModel from "@models/auth"
import SessionModel from "@models/session"
import UserModel from "@models/user"

import {
	NotFound,
	RenderError,
	Crash,
	Login,
	UserRegister,
	Searcher,
	NotificationsCenter,
	PostCreator,
} from "@components"
import { Icons } from "@components/Icons"
import DesktopTopBar from "@components/DesktopTopBar"

import { ThemeProvider } from "@cores/style/style.core.jsx"

import Layout from "./layout"
import * as Router from "./router"
import Splash from "./splash"

import "@styles/index.less"

if (IS_MOBILE_HOST) {
	CapacitorUpdater.notifyAppReady()
}

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
		window.app.isCapacitor = IS_MOBILE_HOST

		if (window.app.version !== window.localStorage.getItem("last_version")) {
			app.message.info(`Comty has been updated to version ${window.app.version}!`)
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

		if (window.__TAURI__) {
			window.__TAURI__.invoke = invoke
		}
	}

	static publicEvents = {}

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
				app.layout.draggable.open("login", Login, {
					props: {
						sessionController: this.sessionController,
						onDone: () => {
							app.layout.draggable.destroy("login")
						}
					},
				})
			},
			openAppsMenu: () => {
				app.layout.drawer.open("apps", AppsMenu)
			},
			openRegisterForm: async (options = {}) => {
				app.layout.drawer.open("Register", UserRegister, {
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
				window.app.layout.drawer.open("notifications", NotificationsCenter, {
					props: {
						width: "fit-content",
					},
					allowMultiples: false,
					escClosable: true,
				})
			},
			openSearcher: (options) => {
				if (app.isMobile) {
					return app.layout.drawer.open("searcher", Searcher, {
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
			openMessages: () => {
				app.location.push("/messages")
			},
			openFullImageViewer: (src) => {
				app.cores.window_mng.render("image_lightbox", <Lightbox
					small={src}
					large={src}
					onClose={() => app.cores.window_mng.close("image_lightbox")}
					hideDownload
					showRotate
				/>)
			},
			openPostCreator: (params) => {
				app.layout.modal.open("post_creator", (props) => <PostCreator
					{...props}
					{...params}
				/>, {
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
		maintenance: {
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
		"auth:disabled_account": async () => {
			await SessionModel.removeToken()
			app.navigation.goAuth()
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

		app.cores.sfx.play("splash_out")

		this.setState({ initialized: true })
	}

	onRuntimeStateUpdate = (state) => {
		console.debug(`[App] Runtime state updated`, state)
	}

	initialization = async () => {
		// await new Promise((resolve) => {
		// 	setTimeout(resolve, 8000)
		// })

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
			user: user,
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
					{
						window.__TAURI__ && <DesktopTopBar />
					}
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

export default new Runtime(ComtyApp)