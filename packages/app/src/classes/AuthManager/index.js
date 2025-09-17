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
		"session:refreshed": () => {
			this._emitBehavior("onRefresh")
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
			await this.flush()
			await this.initialize()
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
			return this._emitBehavior("onNoSession")
		}

		const tokenData = SessionModel.getDecodedToken()

		// fill with some early data from token
		app.userData = {
			_id: tokenData.user_id,
			username: tokenData.username,
		}

		this._emitBehavior("earlyData")

		const user = await UserModel.data().catch((err) => {
			return false
		})

		if (!user) {
			return this._emitBehavior("onFailedUser")
		}

		app.userData = user
		this.state.user = user

		this._emitBehavior("onAuthed")

		console.timeEnd("authmanager:initialize")
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
