import type EvaluateActions from "./index"
import type { Member } from "@comty/shared/types/spaces/member"

import GroupsModel from "comty.js/endpoints/groups"
import logger from "@comty/shared/utils/logger"

function sameIds(left: string[], right: string[]) {
	if (left.length !== right.length) return false

	const set = new Set(left)

	return right.every((id) => set.has(id))
}

export default async function (
	this: EvaluateActions,
	members: Member[],
): Promise<void> {
	if (!this.state.groupId) return

	const connectionsMap = this.state.userConnections
	const memberIds = members
		.map((member) => member.user_id)
		.filter((id): id is string => Boolean(id))

	if (memberIds.length === 0) return

	const missingReferences = memberIds.filter((id) => !connectionsMap.has(id))

	if (missingReferences.length > 0) {
		try {
			const states = await GroupsModel.members.connections(
				this.state.groupId,
				missingReferences,
			)

			if (Array.isArray(states)) {
				states.forEach((memberState: any) => {
					const id = memberState?.userId ?? memberState?.user_id

					if (!id) return

					connectionsMap.set(String(id), {
						connected: Boolean(memberState.connected),
					})
				})
			}
		} catch (err) {
			// keep the current state on a transient failure, a partial read
			// would mark connected users as offline
			logger.error("Failed to evaluate member connections", err)
			return
		}
	}

	// the read is authoritative for the evaluated members, users that are
	// not connected must also leave the online list
	const evaluated = new Set(memberIds)
	const connectedUserIds = memberIds.filter(
		(id) => connectionsMap.get(id)?.connected === true,
	)

	this.setState((currentState) => {
		const preserved = currentState.connectedMembers.filter(
			(id) => !evaluated.has(id),
		)
		const nextConnections = [
			...new Set([...preserved, ...connectedUserIds]),
		]

		return sameIds(nextConnections, currentState.connectedMembers)
			? currentState
			: { connectedMembers: nextConnections }
	})
}
