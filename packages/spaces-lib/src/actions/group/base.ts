import { StoreApi } from "zustand"
import { GroupStoreType } from "../../stores/group/types"

export type SetGroupState = StoreApi<GroupStoreType>["setState"]
export type GetGroupState = StoreApi<GroupStoreType>["getState"]

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
