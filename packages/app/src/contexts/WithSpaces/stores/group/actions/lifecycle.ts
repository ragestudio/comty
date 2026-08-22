import type { SetGroupState, GetGroupState } from "./context"
import type { SpacesGroupActions, CachedGroup } from "../types"

import GroupsModel from "@models/groups"

import { internalState as mutableState } from "../internalState"
import { createDefaultChannels, createDefaultMembers } from "../constants"
import { resolveCachedMembersUsers } from "../../../helpers/cache"

import db from "../../../store"

async function deferredCacheCheck(
	groupId: string,
	cached: CachedGroup,
	actions: SpacesGroupActions,
	generation: number,
) {
	try {
		const meta = await GroupsModel.meta(groupId)

		if (generation !== mutableState.initGeneration) return

		if (cached.group?.__v < meta.group_v) {
			await actions.fetchGroup()
		}

		if (generation !== mutableState.initGeneration) return

		const knownTotal = Math.max(
			cached.total_members ?? 0,
			cached.memberships?.length ?? 0,
		)
		if (knownTotal < (meta.total_members ?? 0)) {
			await actions.fetchMembers()
		}

		if (generation !== mutableState.initGeneration) return

		if ((cached.channels?.total_items ?? 0) < (meta.total_channels ?? 0)) {
			await actions.fetchChannels()
		}
	} catch (err) {
		console.error("deferredCacheCheck failed", err)
	}
}

export const createLifecycle = (set: SetGroupState, get: GetGroupState) => ({
	init: async (groupId: string): Promise<void> => {
		const generation = ++mutableState.initGeneration

		set({
			groupId,
			loading: true,
			error: null,
			channels: createDefaultChannels(),
			members: createDefaultMembers(),
			statedChannels: {},
		})

		try {
			const cachedGroup = await db.groups.get(groupId)
			const cachedChannelsDoc = await db.channels.get(groupId)

			const cachedMemberships = await db.members
				.where("group_id")
				.equals(groupId)
				.limit(50)
				.toArray()

			const cachedTotalMembers = await db.members_counter
				.get(groupId)
				.then((doc) => doc?.counter ?? 0)

			if (generation !== mutableState.initGeneration) return

			const cached: CachedGroup = {
				group: cachedGroup ?? null,
				channels: cachedChannelsDoc ?? null,
				memberships:
					cachedMemberships.length > 0 ? cachedMemberships : null,
				total_members:
					cachedTotalMembers > 0 ? cachedTotalMembers : null,
			}

			if (cached.group) {
				set({ data: cached.group })
			}
			if (cached.channels) {
				set({ channels: cached.channels })
			}
			if (cached.memberships) {
				const populatedMembers = await resolveCachedMembersUsers(
					cached.memberships,
				)
				set({
					members: {
						items: populatedMembers,
						total_items:
							cached.total_members ?? populatedMembers.length,
						has_more: false,
					},
				})
				get().actions.evaluateConnections(populatedMembers)
				get().actions.evaluateDecorations(populatedMembers)
			}

			get().actions.syncRTCChannels().catch(console.error)

			const hasAllCache =
				cached.group && cached.channels && cached.memberships

			if (!hasAllCache) {
				const promises = []

				if (!cached.group) promises.push(get().actions.fetchGroup())
				if (!cached.channels)
					promises.push(get().actions.fetchChannels())
				if (!cached.memberships)
					promises.push(get().actions.fetchMembers())

				await Promise.all(promises)
			}

			if (generation === mutableState.initGeneration) {
				set({ loading: false })
			}

			if (hasAllCache && generation === mutableState.initGeneration) {
				deferredCacheCheck(
					groupId,
					cached,
					get().actions,
					generation,
				).catch(console.error)
			}
		} catch (err: any) {
			if (generation === mutableState.initGeneration) {
				console.error("Failed to init group", err)
				set({ error: err, loading: false })
			}
		}
	},

	reset: () => {
		mutableState.initGeneration++
		set({
			groupId: null,
			data: null,
			channels: createDefaultChannels(),
			members: createDefaultMembers(),
			statedChannels: {},
			connectedMembers: [],
			membersDecorations: {},
			loading: true,
			error: null,
		})
	},
})
