import type { StoreApi } from "zustand"
import type { ImperativeRouter } from "expo-router"

import { EventEmitter } from "tseep/lib/ee-safe"
import * as z from "zustand"
import * as SplashScreen from "expo-splash-screen"

import { WebsocketClient } from "@linebridge/client/src/websocket/index"

import fonts from "./load/fonts"

import ThemeController from "./theme"
import AuthManager from "./auth"
import session from "./session"
import { BaseStore } from "@/lib/spaces/stores/base"

SplashScreen.preventAutoHideAsync()

type AppInitializeParam = {
	router: ImperativeRouter
}

export enum InternalEvents {
	INIT_START = "init:start",
	INIT_FINISH = "init:finish",
	SPLASH_DONE = "init:splash_done",
}

interface AppState {}

export class App extends BaseStore<AppState> {
	router: ImperativeRouter | null = null
	ready: Boolean = false
	earlyDone: Boolean = false
	eventBus: EventEmitter = new EventEmitter()

	socket: WebsocketClient | null = null
	auth: AuthManager = new AuthManager(this)
	theme: ThemeController = new ThemeController(this)
	userData!: typeof session.user | null

	constructor() {
		super({})
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

		// run auth manager
		await this.auth.initialize()

		this.socket = new WebsocketClient({
			url: "https://api.comty.app/ws",
			token: session.token,
			worker: false,
		})

		this.setState({ socket: this.socket })

		this.socket.on("connected", () => {
			console.log("[ws] connected")
		})
		this.socket.on("reconnected", () => {
			console.log("[ws] reconnected")
		})
		this.socket.on("message", (data, msg) => {
			console.log("[ws] message:", data, msg)
		})

		await this.socket.connect()
	}
}

export const app = new App()

export function useStore(): AppState
export function useStore<U>(selector: (state: AppState) => U): U
export function useStore<U>(selector?: (state: AppState) => U) {
	return app.useStore(selector!)
}

export default useStore
