import type { StoreApi } from "zustand"

class ActionsBase<StoreType> {
	setState: StoreApi<StoreType>["setState"]
	getState: StoreApi<StoreType>["getState"]

	constructor(store: StoreApi<StoreType>) {
		this.setState = store.setState
		this.getState = store.getState
	}

	get state() {
		return this.getState()
	}

	get store() {
		return this.getState()
	}
}

export default ActionsBase
