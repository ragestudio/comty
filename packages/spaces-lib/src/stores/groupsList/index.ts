import type { GroupsListStoreType } from "./types"

import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"
import GroupsListActions from "../../actions/groups-list"

export const GroupsListStore = create<GroupsListStoreType>()((set, get) => {
	const actions = new GroupsListActions(GroupsListStore)

	return {
		groups: [],
		loading: true,
		error: null,
		actions: actions,
	}
})

export const useGroupsList = () =>
	GroupsListStore(
		useShallow((s) => ({
			groups: s.groups,
			loading: s.loading,
			error: s.error,
			actions: s.actions,
		})),
	)
