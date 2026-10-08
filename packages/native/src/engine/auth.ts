import type { App } from "./app"

import * as SecureStore from "expo-secure-store"

import AuthModel from "@comty/api-lib/models/auth"
import UserModel from "@comty/api-lib/models/user"
import session from "@comty/api-lib/session"
import wsManager from "@/ws"

export enum AuthStoreKeys {
	Token = "session-token",
	Refresh = "session-refresh_token",
}

type AuthResult = {
	expiresIn: string
	refreshToken: string
	token: string
	user_id: string

	activation_required?: boolean
	mfa_required?: boolean
}

export class AuthManager {
	constructor(private app: App) {}

	async initialize() {
		const sessionToken = await SecureStore.getItemAsync(AuthStoreKeys.Token)

		if (!sessionToken) {
			console.log("Session token no founded, navigation to auth")
			this.app.router?.navigate("/auth")

			return
		}

		await this.loadSession()
	}

	async loadSession() {
		const token = await SecureStore.getItemAsync(AuthStoreKeys.Token)
		const refreshToken = await SecureStore.getItemAsync(
			AuthStoreKeys.Refresh,
		)

		if (!token) {
			throw new Error("Cannot load a session without a valid token")
		}

		try {
			console.log("Loading session with token...")

			session.token = token
			session.refreshToken = refreshToken ?? ""
			session.user = await UserModel.self()

			this.app.setState({
				userData: session.user,
			})

			wsManager.socket?.authenticate(token)

			console.log("Session loaded :", session)
		} catch (err) {
			console.error("Failed to load session", err)
			this.app.router?.navigate("/auth")
		}
	}

	async login(usernameOrEmail: string, password: string, code?: string) {
		const response: AuthResult = await AuthModel.login(
			usernameOrEmail,
			password,
			code,
		)

		if (response.activation_required) {
			throw {
				action_required: "activation",
			}
		}

		if (response.mfa_required) {
			throw {
				action_required: "code",
			}
		}

		await SecureStore.setItemAsync(AuthStoreKeys.Token, response.token)
		await SecureStore.setItemAsync(
			AuthStoreKeys.Refresh,
			response.refreshToken,
		)

		await this.loadSession()

		this.app.router?.navigate("/")

		return response
	}
}

export default AuthManager
