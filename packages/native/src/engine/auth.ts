import type { App } from "./app"

import * as SecureStore from "expo-secure-store"

import AuthEndpoint from "comty.js/endpoints/auth"
import UserEndpoint from "comty.js/endpoints/user"

import session from "comty.js/session"
import Realtime from "comty.js/realtime"
import client from "comty.js/client"

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
			session.user = await UserEndpoint.self()

			this.app.setState({
				userData: session.user,
			})

			client.ws.socket?.authenticate(token)

			console.log("Session loaded :", session)
		} catch (err) {
			console.error("Failed to load session", err)
			this.app.router?.navigate("/auth")
		}
	}

	async login(usernameOrEmail: string, password: string, code?: string) {
		const response = await AuthEndpoint.login({
			username: usernameOrEmail,
			password: password,
			mfa_code: code,
		})

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

		if (!response.token || !response.refreshToken) {
			throw new Error(
				"Invalid server response. Missing 'token' or/and 'refreshToken'",
			)
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
