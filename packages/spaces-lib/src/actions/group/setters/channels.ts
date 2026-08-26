import type SettersActions from "./index"

export default function (this: SettersActions, updater: any): void {
	this.setState((state) => ({
		channels:
			typeof updater === "function" ? updater(state.channels) : updater,
	}))
}
