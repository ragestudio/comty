import type SettersActions from "./index"

export default function (this: SettersActions, updater: any): void {
	this.setState((state) => ({
		members:
			typeof updater === "function" ? updater(state.members) : updater,
	}))
}
