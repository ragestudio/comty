import { StoreApi } from "zustand"
import { SpacesGroupStoreType } from "../../stores/group/types"

export type SetGroupState = StoreApi<SpacesGroupStoreType>["setState"]
export type GetGroupState = StoreApi<SpacesGroupStoreType>["getState"]

class GroupActionsBase {
	setState: SetGroupState
	getState: GetGroupState

	constructor(set: SetGroupState, get: GetGroupState) {
		this.setState = set
		this.getState = get
	}

	get state() {
		return this.getState()
	}
}

export default GroupActionsBase
