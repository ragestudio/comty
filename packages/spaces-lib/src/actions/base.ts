import type { StoreApi } from "zustand"

class ActionsBase<StoreType> {
	setState: StoreApi<StoreType>["setState"]
	getState: StoreApi<StoreType>["getState"]

	constructor(
		setState: StoreApi<StoreType>["setState"],
		getState: StoreApi<StoreType>["getState"],
	) {
		this.setState = setState
		this.getState = getState
	}

	get state() {
		return this.getState()
	}

	get store() {
		return this.getState()
	}
}

export default ActionsBase
