import type { Group } from "@comty/shared/types/spaces/group"

export interface GroupsListStoreType {
	groups: Group[]
	loading: boolean
	error: any

	actions: {
		fetchGroups: () => Promise<void>
		setGroups: (groups: Group[]) => void
		sortGroups: (newOrderIds: string[]) => Promise<void>
		handleMembershipCreated: (data: any) => void
		handleMembershipDeleted: (data: any) => void
	}
}
