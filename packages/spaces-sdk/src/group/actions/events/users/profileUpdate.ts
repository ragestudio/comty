import type EventsActions from "../index"
import type { UserProfileUpdatePayload } from "@/group/types"

import { usersActions } from "@/users"

export default function (
	this: EventsActions,
	payload: UserProfileUpdatePayload,
): void {
	const userId = payload?.user_id

	if (!userId) return

	const decorations = payload.decorations ?? {}
	const profileBadges = payload.profile_badges ?? []

	usersActions.patchUser(userId, {
		profile_badges: profileBadges,
	})

	usersActions.setDecorations(userId, decorations)

	this.setState((state) => ({
		membersDecorations: {
			...state.membersDecorations,
			[userId]: decorations,
		},
		members: {
			...state.members,
			items: state.members.items.map((member) => {
				if (member.user_id !== userId || !member.user) return member

				return {
					...member,
					user: {
						...member.user,
						decorations,
						profile_badges: profileBadges,
					},
				}
			}),
		},
	}))
}
