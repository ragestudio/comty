import type EvaluateActions from "./index"
import type { Member } from "@comty/shared/types/spaces/member"

import { UsersStore, usersActions } from "@/users"
import logger from "@comty/shared/utils/logger"

export default async function (
	this: EvaluateActions,
	items: (Member | string)[],
): Promise<void> {
	const ids = items
		.map((item) => (typeof item === "string" ? item : item.user_id))
		.filter((id): id is string => Boolean(id))

	if (ids.length === 0) return

	try {
		await usersActions.ensureDecorations(ids)

		const { users } = UsersStore.getState()
		const decorations: Record<string, any> = {}

		for (const id of ids) {
			const hydrated = users[id]?.decorations

			if (hydrated) decorations[id] = hydrated
		}

		if (Object.keys(decorations).length === 0) return

		this.setState((state) => ({
			membersDecorations: {
				...state.membersDecorations,
				...decorations,
			},
		}))
	} catch (error) {
		logger.error("Failed to fetch decorations", error)
	}
}
