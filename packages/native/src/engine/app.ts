import type { ImperativeRouter } from "expo-router"

import { EventEmitter } from "tseep/lib/ee-safe"
import * as SplashScreen from "expo-splash-screen"

import fonts from "./load/fonts"

import ThemeController from "./theme"
import AuthManager from "./auth"
import session from "@comty/api-lib/session"

import { BaseStore } from "@comty/spaces-sdk/classes"
import { wsManager } from "@comty/spaces-sdk/ws"
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
	userData: typeof session.user | null
}

export class App extends BaseStore<AppState> {
	router: ImperativeRouter | null = null
	ready: Boolean = false
	earlyDone: Boolean = false
	eventBus: EventEmitter = new EventEmitter()

	auth: AuthManager = new AuthManager(this)
	theme: ThemeController = new ThemeController(this)
	userData!: typeof session.user | null

	constructor() {
		super({
			ready: false,
			earlyDone: false,
			router: null,
			userData: null,
		})
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

		// run websocket manager
		await wsManager.initialize()

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
