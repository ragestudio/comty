import type FetchingActions from "./index"

import GroupsModel from "comty.js/endpoints/groups"
import logger from "@comty/shared/utils/logger"

export default async function (this: FetchingActions): Promise<void> {
	if (!this.state.groupId) return

	const currentGeneration = this.state.initGeneration

	try {
		const viewer = await GroupsModel.permissions(this.state.groupId)

		if (currentGeneration !== this.state.initGeneration) return

		this.setState((state) => {
			if (!state.data || state.data._id !== this.state.groupId) {
				return state
			}

			return {
				data: {
					...state.data,
					viewer_permissions: viewer.permissions,
					viewer_roles: viewer.roles,
					is_owner: viewer.is_owner,
					is_admin: viewer.is_admin,
				},
			}
		})
	} catch (err) {
		logger.error("fetchViewerPermissions failed", err)
	}
}
