import type EventsActions from "../index"
import type { GroupUpdatePayload } from "@/group/types"

import { cacheGroup } from "@/helpers/cache"
import { GroupsListStore } from "@/groupsList"
import logger from "@comty/shared/utils/logger"

export default function (
	this: EventsActions,
	payload: GroupUpdatePayload,
): void {
	// keep the sidebar entry in sync even when the group is not cached
	GroupsListStore.getState().actions.updateGroup(payload as any)

	const state = this.state

	if (!state.data || state.data._id !== payload._id) {
		return
	}

	const ownerChanged =
		typeof payload.owner_user_id === "string" &&
		payload.owner_user_id !== state.data.owner_user_id

	const updatedGroup = { ...state.data, ...payload }

	this.setState({ data: updatedGroup })

	cacheGroup(updatedGroup).catch((err) => {
		logger.error("Failed to update group in cache", err)
	})

	if (ownerChanged) {
		state.actions.fetchViewerPermissions()
	}
}
