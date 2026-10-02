import type { Group } from "@comty/shared/types/spaces/group"
import type { GroupsListStoreType } from "../../stores/groupsList/types"

import ActionsBase from "../base"
import GroupsModel from "@models/groups"

class GroupsListActions extends ActionsBase<GroupsListStoreType> {
	fetchGroups = async () => {
		this.setState({ loading: true, error: null })

		try {
			const res = await GroupsModel.getMy()
			this.setState({ groups: res.items, loading: false })
		} catch (error) {
			this.setState({ error, loading: false })
			console.error("Failed to fetch groups", error)
		}
	}

	setGroups = (groups: Group[]) => {
		this.setState({ groups })
	}

	sortGroups = async (newOrderIds: string[]) => {
		try {
			await GroupsModel.sort(newOrderIds)
		} catch (err) {
			console.error("failed to update group order", err)
		}
	}

	handleMembershipCreated = (data: any) => {
		console.debug("groups:membership:created", data)
		this.store.actions.fetchGroups()
	}

	handleMembershipDeleted = (data: any) => {
		console.debug("groups:membership:deleted", data)
		this.store.actions.fetchGroups()
	}
}

export default GroupsListActions
