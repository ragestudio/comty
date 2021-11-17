import React from "react"
import { Helmet } from "react-helmet"
import progressBar from "nprogress"
import * as antd from "antd"
import classnames from "classnames"

import { Icons } from "components/Icons"
import { CreateEviteApp, BindPropsProvider } from "evite"

import config from "config"
import { Session, User } from "models"
import { NotFound, RenderError } from "components"
import { SettingsController, SidebarController } from "controllers"
import { API, Render, Debug, Sound } from "extensions"

import { Sidebar, Header, Drawer, Sidedrawer } from "./layout"
import "theme/index.less"

// append method to array prototype
Array.prototype.move = function (from, to) {
	this.splice(to, 0, this.splice(from, 1)[0])
	return this
}

class ThrowCrash {
	constructor(message, description) {
		this.message = message
		this.description = description

		antd.notification.error({
			message: "Fatal error",
			description: message,
		})

		window.app.eventBus.emit("crash", this.message, this.description)
	}
}

class App {
	static initialize() {
		this.progressBar = progressBar.configure({ parent: "html", showSpinner: false })

		this.sessionController = new Session()
		this.userController = new User()

		this.configuration = {
			settings: new SettingsController(),
			sidebar: new SidebarController(),
		}

		this.eventBus = this.contexts.main.eventBus

		this.eventBus.on("top_loadBar_start", () => {
			this.progressBar.start()
		})
		this.eventBus.on("top_loadBar_stop", () => {
			this.progressBar.done()
		})

		this.eventBus.on("forceInitialize", async () => {
			await this.initialization()
		})
		this.eventBus.on("forceReloadUser", async () => {
			await this.__init_user()
		})
		this.eventBus.on("forceReloadSession", async () => {
			await this.__init_session()
		})
		this.eventBus.on("forceToLogin", () => {
			if (window.location.pathname !== "/login") {
				this.beforeLoginLocation = window.location.pathname
			}
			window.app.setLocation("/login")
		})

		this.eventBus.on("destroyAllSessions", async () => {
			await this.sessionController.destroyAllSessions()
		})
		this.eventBus.on("new_session", () => {
			this.eventBus.emit("forceInitialize")

			if (window.location.pathname == "/login") {
				window.app.setLocation(this.beforeLoginLocation ?? "/main")
				this.beforeLoginLocation = null
			}
		})
		this.eventBus.on("destroyed_session", () => {
			this.flushState()
			this.eventBus.emit("forceToLogin")
		})

		this.eventBus.on("invalid_session", (error) => {
			if (window.location.pathname !== "/login") {
				this.sessionController.forgetLocalSession()

				antd.notification.open({
					message: "Invalid Session",
					description: error,
					icon: <Icons.MdOutlineAccessTimeFilled />,
				})

				this.eventBus.emit("forceToLogin")
			}
		})

		this.eventBus.on("setLocation", () => {
			this.eventBus.emit("top_loadBar_start")
			this.setState({ isOnTransition: true })
		})
		this.eventBus.on("setLocationDone", () => {
			this.eventBus.emit("top_loadBar_stop")
			this.setState({ isOnTransition: false })
		})
		this.eventBus.on("cleanAll", () => {
			window.app.DrawerController.closeAll()
		})

		this.eventBus.on("crash", (message, error) => {
			this.setState({ crash: { message, error } })
			this.contexts.app.SoundEngine.play("crash")
		})
	}

	static windowContext() {
		return {
			configuration: this.configuration,
			isValidSession: this.isValidSession,
			getSettings: (...args) => this.contexts.app.configuration?.settings?.get(...args),
		}
	}

	static appContext() {
		return {
			sessionController: this.sessionController,
			userController: this.userController,
			configuration: this.configuration,
			progressBar: this.progressBar,
		}
	}

	static staticRenders = {
		NotFound: (props) => {
			return <NotFound />
		},
		RenderError: (props) => {
			return <RenderError {...props} />
		},
	}

	state = {
		// app
		isMobile: false,
		crash: false,
		isOnTransition: false,

		// app session
		session: null,
		data: null,
	}

	layoutContentRef = React.createRef()

	flushState = () => {
		this.setState({ session: null, data: null })
	}

	isValidSession = async () => {
		return await this.sessionController.isCurrentTokenValid()
	}

	componentDidMount = async () => {
		await this.initialization()
	}

	initialization = async () => {
		try {
			await this.contexts.app.initializeDefaultBridge()
			await this.__init_session()
			await this.__init_user()
		} catch (error) {
			throw new ThrowCrash(error.message, error.description)
		}
	}

	__init_session = async () => {
		if (typeof Session.token === "undefined") {
			window.app.eventBus.emit("forceToLogin")
		} else {
			this.session = await this.sessionController.getTokenInfo().catch((error) => {
				window.app.eventBus.emit("invalid_session", error)
			})

			if (!this.session.valid) {
				// try to regenerate
				//const regeneration = await this.sessionController.regenerateToken()
				//console.log(regeneration)

				window.app.eventBus.emit("invalid_session", this.session.error)
			}
		}

		this.setState({ session: this.session })
	}

	__init_user = async () => {
		if (!this.session || !this.session.valid) {
			return false
		}

		try {
			this.user = await User.data
			this.setState({ user: this.user })
		} catch (error) {
			console.error(error)
			this.eventBus.emit("crash", "Cannot initialize user data", error)
		}
	}

	render() {
		if (this.state.crash) {
			return <div className="app_crash">
				<div className="header">
					<Icons.MdOutlineError />
					<h1>Crash</h1>
				</div>
				<h2>{this.state.crash.message}</h2>
				<pre>{this.state.crash.error}</pre>
			</div>
		}

		return (
			<React.Fragment>
				<Helmet>
					<title>{config.app.siteName}</title>
				</Helmet>
				<antd.Layout style={{ height: "100%" }}>
					<Drawer />
					<Sidebar user={this.state.user} />
					<antd.Layout className="app_layout">
						<Header visible={this.state.headerVisible} />
						<antd.Layout.Content className="app_wrapper">
							<div className={classnames("fade-transverse-active", { "fade-transverse-leave": this.state.isOnTransition })}>
								<BindPropsProvider
									user={this.state.user}
									session={this.state.session}
								>
									<Render.RenderRouter staticRenders={App.staticRenders} />
								</BindPropsProvider>
							</div>
						</antd.Layout.Content>
					</antd.Layout>
					<Sidedrawer />
				</antd.Layout>
			</React.Fragment>
		)
	}
}

export default CreateEviteApp(App, {
	extensions: [Sound.extension, Render.extension, API, Debug],
})