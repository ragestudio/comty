import { createStore, StoreApi } from "zustand/vanilla"
import { useStore as useZustandStore } from "zustand"

export class BaseStore<State extends object> {
	protected store: StoreApi<State>

	constructor(initialState: State) {
		this.store = createStore<State>()(() => initialState)
		Object.assign(this, initialState)
	}

	getState() {
		return this.store.getState()
	}

	setState(update: Partial<State> | ((prev: State) => Partial<State>)) {
		if (typeof update === "function") {
			update = update(this.store.getState())
		}

		Object.assign(this, update)
		this.store.setState(update)
	}

	public useStore(): State
	public useStore<U>(selector: (state: State) => U): U
	public useStore<U>(selector?: (state: State) => U): State | U {
		return useZustandStore(
			this.store,
			selector ?? ((s) => s as unknown as U),
		)
	}

	public getInstance = (): this => this
}

export default BaseStore
