import type { StoreApi } from "zustand"
import type { ImperativeRouter } from "expo-router"

import { EventEmitter } from "tseep/lib/ee-safe"
import * as z from "zustand"
import * as SplashScreen from "expo-splash-screen"

import fonts from "./load/fonts"

import ThemeController from "./theme"
import AuthManager from "./auth"
import session from "./session"

SplashScreen.preventAutoHideAsync()

type AppInitializeParam = {
	router: ImperativeRouter
}

export enum InternalEvents {
	INIT_START = "init:start",
	INIT_FINISH = "init:finish",
	SPLASH_DONE = "init:splash_done",
}

export class App {
	setState: StoreApi<App>["setState"]
	getState: StoreApi<App>["getState"]

	constructor(
		setState: StoreApi<App>["setState"],
		getState: StoreApi<App>["getState"],
	) {
		this.setState = setState
		this.getState = getState
	}

	router: ImperativeRouter | null = null
	ready: Boolean = false
	earlyDone: Boolean = false
	eventBus: EventEmitter = new EventEmitter()

	auth: AuthManager = new AuthManager(this)
	theme: ThemeController = new ThemeController(this)
	userData!: typeof session.user | null

	async initialize(params: AppInitializeParam) {
		this.eventBus.emit(InternalEvents.INIT_START)

		// set the router
		this.router = params.router

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
	}
}

export const AppStore = z.create<App>()((set, get) => {
	return new App(set, get)
})

export const useApp = () => AppStore((s) => s)

export default useApp
