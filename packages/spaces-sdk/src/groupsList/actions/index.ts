import type { Group } from "@comty/shared/types/spaces/group"
import type { GroupsListStoreType } from "../types"

import ActionsBase from "@/classes/BaseActions"
import GroupsModel from "comty.js/endpoints/groups"
import logger from "@comty/shared/utils/logger"

class GroupsListActions extends ActionsBase<GroupsListStoreType> {
	fetchGroups = async () => {
		this.setState({ loading: true, error: null })

		try {
			const res = await GroupsModel.getMy()
			this.setState({ groups: res.items, loading: false })
		} catch (error) {
			this.setState({ error, loading: false })
			logger.error("Failed to fetch groups", error)
		}
	}

	setGroups = (groups: Group[]) => {
		this.setState({ groups })
	}

	updateGroup = (group: Partial<Group> & { _id: string }) => {
		this.setState((state) => ({
			groups: state.groups.map((item) =>
				item._id === group._id ? { ...item, ...group } : item,
			),
		}))
	}

	sortGroups = async (newOrderIds: string[]) => {
		try {
			await GroupsModel.sort(newOrderIds)
		} catch (err) {
			logger.error("failed to update group order", err)
		}
	}

	handleMembershipCreated = (data: any) => {
		logger.debug("groups:membership:created", data)
		this.store.actions.fetchGroups()
	}

	handleMembershipDeleted = (data: any) => {
		logger.debug("groups:membership:deleted", data)
		this.store.actions.fetchGroups()
	}
}

export default GroupsListActions
