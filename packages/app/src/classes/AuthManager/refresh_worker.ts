import * as Comlink from "comlink"
import { jwtDecode } from "jwt-decode"
import { DateTime } from "luxon"

var refreshTimeout = null
var refreshToken = null
var token = null

type RefreshConfig = {
	token: string
	refreshToken: string
	endpoint: string
	method: "POST" | "GET"
	onRefreshing: () => void
	onRefreshCallback: (data: any) => void
	onRefreshErrorCallback: (err: Error) => void
}

async function doTokenRefresh(
	_token: string,
	_refreshToken: string,
	config: RefreshConfig,
) {
	if (!_token || !_refreshToken) {
		console.error("doTokenRefresh(): Token or refreshToken not set")
		return
	}

	console.debug("Refreshing token...")

	if (typeof config.onRefreshing === "function") {
		config.onRefreshing()
	}

	let res = await fetch(config.endpoint, {
		method: config.method ?? "GET",
		body: JSON.stringify({
			authToken: _token,
			refreshToken: _refreshToken,
		}),
		headers: {
			"Content-Type": "application/json",
		},
	})

	if (!res.ok) {
		console.error("doTokenRefresh(): Token refresh failed")

		if (typeof config.onRefreshErrorCallback === "function") {
			config.onRefreshErrorCallback(new Error("Failed to refresh token"))
		}

		return
	}

	const data = await res.json()

	// Update the token and refreshToken with the new values
	token = data.token
	refreshToken = data.refreshToken

	if (typeof config.onRefreshCallback === "function") {
		config.onRefreshCallback(data)
	}

	// Configure the refresh timeout
	configureRefreshTimeout(config)
}

function configureRefreshTimeout(config: RefreshConfig) {
	if (!token || !refreshToken) {
		console.error(
			"configureRefreshTimeout(): Token or refreshToken not set",
		)
		return
	}

	const decoded = jwtDecode(token)

	const timeUntilExpiry = decoded.exp * 1000 - Date.now()
	const timeUntilRefresh = timeUntilExpiry - 2 * 60 * 1000

	const createdAt = DateTime.fromMillis(decoded.iat * 1000)
	const expiresAt = DateTime.fromMillis(decoded.exp * 1000)

	const totalValidHours = expiresAt.diff(createdAt, "hours").hours

	console.debug("Token signed at:", new Date(decoded.iat * 1000))
	console.debug(
		"Token refresh date:",
		new Date(Date.now() + timeUntilRefresh),
	)
	console.debug("Total valid hours:", totalValidHours)

	if (refreshTimeout) {
		clearTimeout(refreshTimeout)
		refreshTimeout = null
	}

	refreshTimeout = setTimeout(() => {
		console.debug("Token is about to expire, triggering refresh...")
		doTokenRefresh(token, refreshToken, config)
	}, timeUntilRefresh)
}

async function initialize(
	config: RefreshConfig,
	onRefreshing: () => void,
	onRefreshCallback: (data: any) => void,
	onRefreshErrorCallback: (err: Error) => void,
) {
	if (!config) {
		throw new Error("config is required")
	}

	if (!config.token) {
		throw new Error("token is required")
	}

	if (!config.refreshToken) {
		throw new Error("refreshToken is required")
	}

	if (typeof onRefreshing === "function") {
		config.onRefreshing = onRefreshing
	}

	if (typeof onRefreshCallback === "function") {
		config.onRefreshCallback = onRefreshCallback
	}

	if (typeof onRefreshErrorCallback === "function") {
		config.onRefreshErrorCallback = onRefreshErrorCallback
	}

	token = config.token
	refreshToken = config.refreshToken

	configureRefreshTimeout(config)

	return
}

Comlink.expose({
	initialize: initialize,
})
