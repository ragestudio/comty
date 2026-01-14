import AuthModel from "@models/auth"
import SessionModel from "@models/session"
import UserModel from "@models/user"

import { Login } from "@components"

export default class AuthManager {
	constructor(params = {}, runtime) {
		this.runtime = runtime
		this.params = params
		this.behaviors = params.behaviors ?? {}

		this.runtime.registerPublicField("auth", this.public)

		for (const [event, handler] of Object.entries(this.events)) {
			this.runtime.eventBus.on(event, handler)
		}
	}

	state = {
		firstInit: true,
		user: null,
	}

	public = {
		login: () => {
			app.layout.draggable.open("login", Login, {
				componentProps: {
					onDone: this.handlers.login,
				},
			})
		},
		logout: (bypass) => {
			if (bypass) {
				return this.handlers.logout()
			}

			app.layout.modal.confirm({
				headerText: "Logout",
				descriptionText: "Are you sure you want to logout?",
				onConfirm: this.handlers.logout,
			})
		},
	}

	events = {
		"auth:login_success": () => {
			this._emitBehavior("onLogin")
		},
		"auth:logout_success": () => {
			this._emitBehavior("onLogout")
		},
		"session:invalid": () => {
			this._emitBehavior("onInvalidSession")
		},
		"session:refreshed": () => {
			if (!this.state.firstInit) {
				this._emitBehavior("onRefresh")
			}
		},
	}

	builtInBehavior = {
		onAuthed: async () => {
			app.eventBus.emit("authmanager:authed")
		},
		onNoSession: async () => {
			app.eventBus.emit("authmanager:noSession")
		},
		onFailedUser: async () => {
			app.eventBus.emit("authmanager:failedUser")
		},
		onRefresh: async () => {
			app.eventBus.emit("authmanager:refresh")
		},
		onLogin: async () => {
			app.eventBus.emit("authmanager:login")
			await this.flush()
			await this.initialize()
		},
		onLogout: async () => {
			app.eventBus.emit("authmanager:logout")
			await this.flush()
		},
		onInvalidSession: async () => {
			app.eventBus.emit("authmanager:invalidSession")

			const token = await SessionModel.token

			if (!token) {
				return false
			}

			await SessionModel.destroyCurrentSession()
		},
		onDisabledAccount: async () => {
			app.eventBus.emit("authmanager:disabledAccount")

			await SessionModel.removeToken()
		},
		earlyData: () => {
			app.eventBus.emit("authmanager:earlyData")
		},
	}

	initialize = async () => {
		console.time("authmanager:initialize")

		const token = SessionModel.token

		if (!token || token == null) {
			console.log("no token")

			console.timeEnd("authmanager:initialize")
			return this._emitBehavior("onNoSession")
		}

		const tokenData = SessionModel.getDecodedToken()

		// fill with some early data from token
		app.userData = {
			_id: tokenData.user_id,
			username: tokenData.username,
		}

		console.log("auth manager early data", app.userData)
		this._emitBehavior("earlyData")

		const user = await UserModel.data().catch((err) => {
			return false
		})

		if (!user) {
			console.log("failed user")

			console.timeEnd("authmanager:initialize")
			return this._emitBehavior("onFailedUser")
		}

		app.userData = user
		this.state.user = user

		console.log("auth manager ok", user)
		console.timeEnd("authmanager:initialize")

		this.state.firstInit = false
		this._emitBehavior("onAuthed")

		return user
	}

	flush = async () => {
		this.state.user = null

		delete app.userData
	}

	_emitBehavior = async (behavior, ...args) => {
		if (typeof this.builtInBehavior[behavior] === "function") {
			await this.builtInBehavior[behavior](...args)
		}

		if (typeof this.behaviors[behavior] === "function") {
			await this.behaviors[behavior](...args)
		}
	}

	handlers = {
		logout: async () => {
			await AuthModel.logout()
			this._emitBehavior("onLogout")
		},
		login: async () => {
			console.log("errmm what tha sigma")
		},
	}
}
