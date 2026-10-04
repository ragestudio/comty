import { createStore, StoreApi } from "zustand/vanilla"
import { useStore as useZustandStore } from "zustand"

export class BaseStore<State extends object> {
	private store: StoreApi<State>

	constructor(initialState: State) {
		this.store = createStore<State>()(() => initialState)
		Object.assign(this, initialState)
	}

	protected setState(partial: Partial<State>) {
		Object.assign(this, partial)
		this.store.setState(partial)
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
