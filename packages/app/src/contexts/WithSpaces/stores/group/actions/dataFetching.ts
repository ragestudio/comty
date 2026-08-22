import type { SetGroupState, GetGroupState } from "./context"
import type { Member } from "@comty/shared/types/spaces/member"
import type { Group } from "@comty/shared/types/spaces/group"
import type { Channels } from "@comty/shared/types/spaces/channel"

import GroupsModel from "@models/groups"
import UsersModel from "@models/user"

import { internalState as mutableState } from "../internalState"
import { VALID_CHANNEL_KINDS, INITIAL_CACHE_PAGE_SIZE } from "../constants"
import {
	cacheGroup,
	cacheChannels,
	cacheMembers,
	cacheTotalMembers,
	cacheUsers,
} from "../../../helpers/cache"

export const createDataFetching = (set: SetGroupState, get: GetGroupState) => ({
	fetchGroup: async (): Promise<Group | null> => {
		const state = get()
		if (!state.groupId) return null

		const currentGeneration = mutableState.initGeneration
		try {
			const response = await GroupsModel.get(state.groupId)
			if (currentGeneration !== mutableState.initGeneration) return null

			if (response) {
				set({ data: response })
				await cacheGroup(response)
			}
			return response
		} catch (err: any) {
			console.error("fetchGroup failed", err)
			return null
		}
	},

	fetchChannels: async (): Promise<Channels | null> => {
		const state = get()
		if (!state.groupId) return null

		const currentGeneration = mutableState.initGeneration
		try {
			const response = await GroupsModel.channels.list(state.groupId)
			if (currentGeneration !== mutableState.initGeneration) return null

			if (response?.items) {
				const filtered = {
					...response,
					items: response.items.filter((c: any) =>
						VALID_CHANNEL_KINDS.includes(c.kind),
					),
				}
				set({ channels: filtered })
				await cacheChannels(state.groupId, filtered)
				return filtered
			}
			return null
		} catch (err: any) {
			console.error("fetchChannels failed", err)
			return null
		}
	},

	fetchMembers: async (): Promise<void> => {
		const state = get()
		if (!state.groupId) return

		const currentGeneration = mutableState.initGeneration
		try {
			const response = await GroupsModel.members.list(state.groupId, {
				limit: INITIAL_CACHE_PAGE_SIZE,
			})
			if (currentGeneration !== mutableState.initGeneration) return

			if (response?.items) {
				set({ members: response })

				const users = response.items
					.map((m: any) => m.user)
					.filter(Boolean)
				await cacheUsers(users)

				const bareMembers = response.items.map((m: any) => {
					const { user, ...rest } = m
					return rest
				})

				await cacheMembers(state.groupId, bareMembers)
				await cacheTotalMembers(state.groupId, response.total_items)

				get().actions.evaluateConnections(response.items)
				get().actions.evaluateDecorations(response.items)
			}
		} catch (err: any) {
			console.error("fetchMembers failed", err)
		}
	},

	syncRTCChannels: async (): Promise<void> => {
		const state = get()
		if (!state.groupId) return

		const currentGeneration = mutableState.initGeneration
		try {
			const response = await GroupsModel.rtc.getGroupState(state.groupId)
			if (currentGeneration !== mutableState.initGeneration) return

			if (Array.isArray(response)) {
				const statedChannels = response.reduce(
					(curr: Record<string, any>, channel: any) => {
						curr[channel._id] = channel
						return curr
					},
					{},
				)
				set({ statedChannels })
			}
		} catch (err: any) {
			console.error("syncRTCChannels failed", err)
		}
	},

	evaluateConnections: async (members: Member[]): Promise<void> => {
		const state = get()
		if (!state.groupId) return

		const connectionsMap = mutableState.userConnections
		const missingReferences: string[] = []

		members.forEach((m) => {
			if (!connectionsMap.has(m.user_id)) {
				missingReferences.push(m.user_id)
			}
		})

		if (missingReferences.length > 0) {
			try {
				const states = await (GroupsModel as any).members.connections(
					state.groupId,
					missingReferences,
				)

				if (Array.isArray(states)) {
					states.forEach((memberState: any) => {
						connectionsMap.set(memberState.userId, memberState)
					})
				}
			} catch (err) {
				console.error("Failed to evaluate member connections", err)
			}
		}

		const connectedUserIds: string[] = []
		members.forEach((m) => {
			const conn = connectionsMap.get(m.user_id)
			if (conn?.connected) {
				connectedUserIds.push(m.user_id)
			}
		})

		set((currentState) => {
			const newConnections = [
				...new Set([
					...currentState.connectedMembers,
					...connectedUserIds,
				]),
			]
			return newConnections.length !==
				currentState.connectedMembers.length
				? { connectedMembers: newConnections }
				: currentState
		})
	},

	evaluateDecorations: async (members: Member[]): Promise<void> => {
		const cache = mutableState.decorationsCache

		members.forEach((m) => {
			if (m.user?.decorations && !cache.has(m.user_id)) {
				cache.set(m.user_id, m.user.decorations)
			}
		})

		const knownDecorations: Record<string, any> = {}
		let hasKnown = false

		members.forEach((m) => {
			const cachedDecs = cache.get(m.user_id)
			if (cachedDecs) {
				knownDecorations[m.user_id] = cachedDecs
				hasKnown = true
			}
		})

		if (hasKnown) {
			set((state) => ({
				membersDecorations: {
					...state.membersDecorations,
					...knownDecorations,
				},
			}))
		}

		const missingIds = members
			.map((m) => m.user_id)
			.filter((id) => !cache.has(id))

		if (missingIds.length === 0) return

		missingIds.forEach((id) => cache.set(id, {}))

		try {
			const users_ids = missingIds.join(",")
			const fetchedData = await UsersModel.V2.decorations.get(users_ids)

			if (Array.isArray(fetchedData)) {
				const newDecorationsDict = fetchedData.reduce(
					(acc: Record<string, any>, curr: any) => {
						const decs = curr.decorations || {}
						cache.set(curr.user_id, decs)
						acc[curr.user_id] = decs
						return acc
					},
					{},
				)

				set((state) => ({
					membersDecorations: {
						...state.membersDecorations,
						...newDecorationsDict,
					},
				}))
			}
		} catch (err) {
			console.error("[decorations] Failed to fetch decorations", err)
			missingIds.forEach((id) => cache.delete(id)) // rollback
		}
	},
})
