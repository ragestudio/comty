import type EventsActions from "../index"

export default function (this: EventsActions): void {
	this.setState((state) => ({
		rolesVersion: (state.rolesVersion ?? 0) + 1,
	}))

	// role changes can affect every member
	this.state.actions.fetchViewerPermissions()
	this.state.actions.fetchMembers()
}
