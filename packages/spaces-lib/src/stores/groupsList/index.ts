import type { Group } from "@comty/shared/types/spaces/group"
import type { GroupsListStoreType } from "./types"

import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"

import GroupsModel from "@models/groups"

export const GroupsListStore = create<GroupsListStoreType>()((set, get) => ({
	groups: [],
	loading: true,
	error: null,

	actions: {
		fetchGroups: async () => {
			set({ loading: true, error: null })
			try {
				const res = await GroupsModel.getMy()
				set({ groups: res.items, loading: false })
			} catch (error) {
				set({ error, loading: false })
				console.error("Failed to fetch groups", error)
			}
		},

		setGroups: (groups: Group[]) => {
			set({ groups })
		},

		sortGroups: async (newOrderIds: string[]) => {
			try {
				await GroupsModel.sort(newOrderIds)
			} catch (err) {
				console.error("failed to update group order", err)
			}
		},

		handleMembershipCreated: (data: any) => {
			console.debug("groups:membership:created", data)
			get().actions.fetchGroups()
		},

		handleMembershipDeleted: (data: any) => {
			console.debug("groups:membership:deleted", data)
			get().actions.fetchGroups()
		},
	},
}))

export const useGroupsList = () =>
	GroupsListStore(
		useShallow((s) => ({
			groups: s.groups,
			loading: s.loading,
			error: s.error,
			actions: s.actions,
		})),
	)
