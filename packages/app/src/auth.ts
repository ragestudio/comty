import { authManager } from "comty.js/core/auth"
import client from "comty.js/core/client"
import session from "comty.js/core/session"

import Login from "@components/Login"

let initialized = false

export type AuthBehaviors = {
	onLogin?: () => unknown | Promise<unknown>
	onLogout?: () => unknown | Promise<unknown>
	onInvalidSession?: () => unknown | Promise<unknown>
	onDisabledAccount?: () => unknown | Promise<unknown>
}

const syncUser = () => {
	const user = authManager.user

	if (user) {
		app.userData = user
	} else {
		delete app.userData
	}
}

const applyEarlyUserData = () => {
	const decoded = session.decodedToken as any

	if (!decoded) return

	app.userData = {
		_id: decoded.user_id,
		username: decoded.username,
		flags: decoded.flags ?? [],
	}
}

const emitBehavior = (behaviors: AuthBehaviors, name: keyof AuthBehaviors) => {
	if (typeof behaviors[name] === "function") {
		return behaviors[name]!()
	}
}

export function initAuth(runtime: any, behaviors: AuthBehaviors = {}) {
	if (!initialized) {
		initialized = true

		runtime.registerPublicField("auth", {
			login: () =>
				app.layout.draggable.open("login", Login, {
					componentProps: { onDone: () => {} },
				}),
			logout: (confirm = false) => {
				if (confirm === true) return authManager.logout()

				app.layout.modal.confirm({
					headerText: "Logout",
					descriptionText: "Are you sure you want to logout?",
					onConfirm: () => authManager.logout(),
				})
			},
			state: () => authManager.state,
			user: () => authManager.user,
		})

		client.eventBus.on("auth:ready", () => {
			syncUser()
			app.eventBus.emit("authmanager:authed")
		})

		client.eventBus.on("auth:login_success", async () => {
			await authManager.adopt()

			syncUser()
			app.eventBus.emit("authmanager:login")
			await emitBehavior(behaviors, "onLogin")

			app.eventBus.emit("authmanager:authed")
		})

		client.eventBus.on("auth:logout_success", async () => {
			syncUser()
			app.eventBus.emit("authmanager:logout")
			await emitBehavior(behaviors, "onLogout")
		})

		client.eventBus.on("session:refreshed", () => {
			syncUser()
			app.eventBus.emit("authmanager:refresh")
		})

		client.eventBus.on("session:invalid", async () => {
			app.eventBus.emit("authmanager:invalidSession")
			await emitBehavior(behaviors, "onInvalidSession")
		})
	}

	return {
		initialize: async () => {
			await session.restore()
			applyEarlyUserData()

			return authManager.start()
		},
	}
}

export default initAuth
