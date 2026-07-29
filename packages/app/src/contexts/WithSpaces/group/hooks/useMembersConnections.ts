import type { Member } from "../../collections/member"

import React from "react"
import GroupsModel from "@models/groups"

export type UserConnectionReference = {
	connected: boolean
}

export const useMembersConnections = (group_id: string) => {
	const [connectedMembers, setConnectedMembers] = React.useState<string[]>([])
	const usersConnectionsRef = React.useRef<
		Map<string, UserConnectionReference>
	>(new Map()).current

	const evaluateMembersConnections = React.useCallback(
		async (members: Member[]) => {
			console.debug("[members] evaluating:", members)

			if (members.length === 0) return

			let missingReferences: string[] = []

			for (const member of members) {
				if (!usersConnectionsRef.has(member.user_id)) {
					missingReferences.push(member.user_id)
				}
			}

			console.debug("[members] missing refs:", missingReferences)

			const states = await GroupsModel.members.connections(
				group_id,
				missingReferences,
			)

			if (!Array.isArray(states)) return

			console.log("[members] computing ref states:", states)

			for (const memberState of states) {
				usersConnectionsRef.set(memberState.userId, memberState)

				setConnectedMembers((prev) => {
					const newState = [...prev]

					if (
						memberState.connected &&
						!newState.includes(memberState.userId)
					) {
						newState.push(memberState.userId)
					} else if (
						!memberState.connected &&
						newState.includes(memberState.userId)
					) {
						return newState.filter(
							(id) => id !== memberState.userId,
						)
					}

					return newState
				})
			}
		},
		[group_id, setConnectedMembers, usersConnectionsRef],
	)

	return {
		connectedMembers,
		setConnectedMembers,
		usersConnectionsRef,
		evaluateMembersConnections,
	}
}
