import type { ImperativeRouter } from "expo-router"

import { EventEmitter } from "tseep/lib/ee-safe"
import * as SplashScreen from "expo-splash-screen"

import fonts from "./load/fonts"

import { reconnectionToastStore } from "./reconnectionToast"
import ThemeController from "./theme"

import client from "comty.js/client"
import { authManager } from "comty.js"

import { BaseStore } from "@comty/spaces-sdk/classes"
import { rtcService } from "@comty/spaces-sdk/rtc"

SplashScreen.preventAutoHideAsync()

type AppInitializeParam = {
	router: ImperativeRouter
}

export enum InternalEvents {
	INIT_START = "init:start",
	INIT_FINISH = "init:finish",
	SPLASH_DONE = "init:splash_done",
}

interface AppState {
	ready: boolean
	earlyDone: boolean
	router: ImperativeRouter | null
	connected: boolean
}

export class App extends BaseStore<AppState> {
	router: ImperativeRouter | null = null
	ready: Boolean = false
	earlyDone: Boolean = false
	eventBus: EventEmitter = new EventEmitter()

	theme: ThemeController = new ThemeController(this)

	constructor() {
		super({
			ready: false,
			earlyDone: false,
			router: null,
			connected: false,
		})
	}

	private async initializeAuthManager() {
		authManager.on("auth:unauthenticated", () => {
			console.log("unauthed")
			this.router?.navigate("/auth")
		})
		authManager.on("session:invalid", () => {
			this.router?.navigate("/auth")
		})
		authManager.on("auth:login_success", async () => {
			console.log("login success")
			await authManager.adopt()
			this.router?.navigate("/")
		})
		authManager.on("auth:logout_success", async () => {
			this.router?.navigate("/auth")
		})

		// run auth manager
		await authManager.start()

		console.log("authManagerStore:", authManager.store.getState())
	}

	async initialize(params: AppInitializeParam) {
		this.eventBus.emit(InternalEvents.INIT_START)

		// set the router
		this.setState({
			router: params.router,
		})

		// load fonts
		await fonts()

		// Set early done, and hide splash
		this.setState({ earlyDone: true })
		SplashScreen.hide()
		this.eventBus.emit(InternalEvents.SPLASH_DONE)

		// set the ready state and emit event
		this.setState({ ready: true })
		this.eventBus.emit(InternalEvents.INIT_FINISH)

		await this.initializeAuthManager()

		const socket = client.ws.get("main")

		if (socket) {
			socket.on("close", () => {
				this.setState({ connected: false })
			})
			socket.on("error", () => {
				this.setState({ connected: false })
			})
			socket.on("reconnecting", () => {
				this.setState({ connected: false })
				reconnectionToastStore.getState().open()
			})
			socket.on("connected", () => {
				this.setState({ connected: true })
				reconnectionToastStore.getState().close()
			})
			socket.on("reconnected", () => {
				this.setState({ connected: true })
				reconnectionToastStore.getState().close()
			})

			await client.ws.connect("main")
		}

		// run rtc service
		await rtcService.initialize()
	}
}

export const app = new App()

export function useStore(): AppState
export function useStore<U>(selector: (state: AppState) => U): U
export function useStore<U>(selector?: (state: AppState) => U) {
	return app.useStore(selector!)
}

export default useStore
