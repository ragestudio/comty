import type { Group } from "../../collections/group"
import type { Channels } from "../../collections/channel"
import type { Member, Members } from "../../collections/member"

import React from "react"
import GroupsModel from "@models/groups"

import db from "../../store"
import { resolveCachedMembersUsers } from "../../helpers/cache"

export interface CachedGroup {
	group: Group | null
	memberships: Member[] | null
	total_members: number | null
	channels: Channels | null
}

export const INITIAL_CACHE_PAGE_SIZE = 50

export interface UseGroupLoadProps {
	group_id: string
	fetchGroup: () => Promise<Group>
	setData: (data: Group) => void

	fetchMembers: () => Promise<any>
	setMembers: (members: Members) => void
	evaluateMembersConnections: (members: Member[]) => Promise<void>
	evaluateMembersDecorations: (members: Member[]) => Promise<void>

	fetchChannels: () => Promise<Channels>
	setChannels: (channels: Channels) => void

	syncStatedRTCChannels: () => Promise<any>
}

export const useGroupLoad = ({
	group_id,
	fetchGroup,
	setData,
	fetchMembers,
	setMembers,
	evaluateMembersConnections,
	evaluateMembersDecorations,
	fetchChannels,
	setChannels,
	syncStatedRTCChannels,
}: UseGroupLoadProps) => {
	const [loading, setLoading] = React.useState<boolean>(true)
	const [error, setError] = React.useState<Error | null>(null)

	const deferredCacheChecking = async (cached: CachedGroup) => {
		try {
			console.debug("[cache] checking", { cached })
			const meta = await GroupsModel.meta(group_id)
			console.debug("[cache] actual meta:", meta)

			if ((cached.group as any)?.__v < meta.group_v) {
				console.debug("[cache] group_v invalidated", {
					cached: (cached.group as any)?.__v,
					actual: meta.group_v,
				})
				await fetchGroup()
			}

			const knownTotal = Math.max(
				cached.total_members ?? 0,
				cached.memberships?.length ?? 0,
			)
			if (knownTotal < (meta.total_members ?? 0)) {
				console.debug("[cache] total_members invalidated", {
					knownTotal,
					actual: meta.total_members,
				})
				await fetchMembers()
			}

			if (
				(cached.channels?.total_items ?? 0) < (meta.total_channels ?? 0)
			) {
				console.debug("[cache] channels.total_items invalidated", {
					cached: cached.channels?.total_items,
					actual: meta.total_channels,
				})
				await fetchChannels()
			}
		} catch (err) {
			console.error("[cache] check fail:", err)
		}
	}

	const load = React.useCallback(async () => {
		setLoading(true)
		setError(null)

		let cached = {
			group: null,
			memberships: null,
			total_members: 0,
			channels: null,
		} as CachedGroup

		try {
			cached.group = await db.groups.get(group_id)
			cached.channels = await db.channels.get(group_id)
			cached.memberships = await db.members
				.where("group_id")
				.equals(group_id)
				.limit(INITIAL_CACHE_PAGE_SIZE)
				.toArray()
			cached.total_members =
				(await db.members_counter.get(group_id))?.counter ?? 0
		} catch (err) {
			console.error("Failed to get cached content", err)
		}

		console.log("useGroup::load()", { group_id, cached })

		try {
			// fetch the group data, if the group data is not cached
			if (!cached.group || !(cached.group as any)?.cached_at) {
				cached.group = await fetchGroup()
			} else {
				setData(cached.group)
			}

			// fetch the members list if not cached or is empty
			if (!cached.memberships || cached.memberships.length === 0) {
				await fetchMembers()
			} else {
				// inject user data from users cache into memberships
				cached.memberships = await resolveCachedMembersUsers(
					cached.memberships,
				)

				setMembers({
					items: cached.memberships,
					total_items: cached.total_members as number,
					has_more:
						(cached.total_members ?? 0) > cached.memberships.length,
				})

				evaluateMembersConnections(cached.memberships)
				evaluateMembersDecorations(cached.memberships)
			}

			// fetch the channels list if not cached or is empty
			if (!cached.channels || !(cached.channels as any)?.cached_at) {
				cached.channels = await fetchChannels()
			} else {
				setChannels(cached.channels)
			}
		} catch (err) {
			console.error(err)
			setError(err as Error)
		} finally {
			setLoading(false)
			deferredCacheChecking(cached)
			await syncStatedRTCChannels()
		}
	}, [
		group_id,
		fetchGroup,
		setData,
		fetchMembers,
		setMembers,
		evaluateMembersConnections,
		evaluateMembersDecorations,
		fetchChannels,
		setChannels,
		syncStatedRTCChannels,
	])

	return { loading, error, load }
}
