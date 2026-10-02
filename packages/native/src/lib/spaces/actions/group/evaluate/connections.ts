import type EvaluateActions from "./index"
import type { Member } from "@comty/shared/types/spaces/member"

import GroupsModel from "@models/groups"

export default async function (
	this: EvaluateActions,
	members: Member[],
): Promise<void> {
	if (!this.state.groupId) return

	const connectionsMap = this.state.userConnections
	const missingReferences: string[] = []

	members.forEach((m) => {
		if (!connectionsMap.has(m.user_id)) {
			missingReferences.push(m.user_id)
		}
	})

	if (missingReferences.length > 0) {
		try {
			const states = await GroupsModel.members.connections(
				this.state.groupId,
				missingReferences,
			)

			if (Array.isArray(states)) {
				states.forEach((memberState: any) => {
					connectionsMap.set(memberState.userId, memberState)
				})
			}
		} catch (err) {
			console.error("Failed to evaluate member connections", err)
		}
	}

	const connectedUserIds: string[] = []

	members.forEach((m) => {
		const conn = connectionsMap.get(m.user_id)

		if (conn?.connected) {
			connectedUserIds.push(m.user_id)
		}
	})

	this.setState((currentState) => {
		const newConnections = [
			...new Set([...currentState.connectedMembers, ...connectedUserIds]),
		]
		return newConnections.length !== currentState.connectedMembers.length
			? { connectedMembers: newConnections }
			: currentState
	})
}
