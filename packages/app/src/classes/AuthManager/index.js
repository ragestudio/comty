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

	public = {
		login: () => {
			app.layout.draggable.open("login", Login, {
				props: {
					onDone: () => {
						app.layout.draggable.destroy("login")
						this._emitBehavior("onLogin")
					},
				},
			})
		},
		logout: () => {
			app.layout.modal.confirm({
				headerText: "Logout",
				descriptionText: "Are you sure you want to logout?",
				onConfirm: () => {
					console.log("Logout confirmed")
					AuthModel.logout()
					this._emitBehavior("onLogout")
				},
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
	}

	builtInBehavior = {
		onInvalidSession: async () => {
			const token = await SessionModel.token

			if (!token) {
				return false
			}

			await SessionModel.destroyCurrentSession()
		},
		onDisabledAccount: async () => {
			await SessionModel.removeToken()
		},
	}

	state = {
		user: null,
	}

	initialize = async () => {
		const token = await SessionModel.token

		if (!token || token == null) {
			return this._emitBehavior("noSession")
		}

		const user = await UserModel.data().catch((err) => {
			return false
		})

		if (!user) {
			return this._emitBehavior("failedUser")
		}

		app.userData = user
		this.state.user = user
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
}
