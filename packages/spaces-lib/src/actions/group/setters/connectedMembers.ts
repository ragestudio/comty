import type SettersActions from "./index"

export default function (this: SettersActions, updater: any): void {
	this.setState((state) => ({
		connectedMembers:
			typeof updater === "function"
				? updater(state.connectedMembers)
				: updater,
	}))
}
