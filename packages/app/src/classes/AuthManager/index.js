import AuthModel from "@models/auth"
import SessionModel from "@models/session"
import UserModel from "@models/user"
import localforage from "localforage"

import { Login } from "@components"

export default class AuthManager {
	constructor(params = {}, runtime) {
		this.runtime = runtime
		this.params = params
		this.behaviors = params.behaviors ?? {}

		this.public.initialize = this.initialize
		this.runtime.registerPublicField("auth", this.public)

		for (const [event, handler] of Object.entries(this.events)) {
			this.runtime.eventBus.on(event, handler)
		}
	}

	state = {
		user: null,
	}

	store = localforage.createInstance({
		driver: localforage.INDEXEDDB,
		name: "tokens",
	})

	listAvailableTokens = async () => {
		const keys = await this.store.keys()
		console.log("Tokens guardados en localforage:", keys)

		const sessions = await Promise.all(
			keys.map(async (key) => {
				const session = await this.store.getItem(key)
				console.log("Sesión leída:", key, session)
				return {
					userId: key,
					name: session?.name || `Usuario ${key}`,
					avatar: session?.avatarUrl || null,
				}
			})
		)
		return sessions
	}
	listAvailableTokens = async () => {
		const keys = await this.store.keys()
		console.log("Tokens guardados en localforage:", keys)

		const sessions = await Promise.all(
			keys.map(async (key) => {
				const session = await this.store.getItem(key)
				console.log("Sesión leída:", key, session)
				return {
					userId: key,
					name: session?.name || `Usuario ${key}`,
					avatar: session?.avatarUrl || null,
				}
			})
		)
		return sessions
	}

	loadTokenFromUserId = async (user_id) => {
		const session = await this.store.getItem(user_id)

		if (!session) {
			throw new Error("No session user found for the given user ID.")
		}

		SessionModel.token = session.token
		SessionModel.refreshToken = session.refreshToken

		await this.initialize()

		if (!this.state.user) {
			throw new Error("No user data found after loading token.")
		}
	}

	public = {
		loadTokenFromUserId: this.loadTokenFromUserId,
		listAvailableTokens: this.listAvailableTokens,
		login: () => {
			app.layout.draggable.open("login", Login, {
				componentProps: {
					onDone: this.onLoginCallback,
				},
			})
		},
		logout: (bypass) => {
			if (bypass === true) {
				AuthModel.logout()
				return this._emitBehavior("onLogout")
			}

			app.layout.modal.confirm({
				headerText: "Logout",
				descriptionText: "Are you sure you want to logout?",
				onConfirm: () => {
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

	handleUserDataUpdate = (data) => {
		this.state.user = data
		app.eventBus.emit("self:user:update", data)
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

	onLoginCallback = async (state, result) => {
		console.log("Guardando sesión:", result)
		await this.store.setItem(result.user_id, {
			...result,
			name: result.name || result.username || `Usuario ${result.user_id}`,
			avatarUrl: result.avatarUrl || result.avatar || null,
		})

		if (this.runtime && this.runtime.eventBus) {
			this.runtime.eventBus.emit("auth:tokens_updated")
		}
	}
}
