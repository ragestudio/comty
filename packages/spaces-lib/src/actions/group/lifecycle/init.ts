import type LifecycleActions from "./index"
import type {
	GroupStoreActions,
	CachedGroup,
} from "../../../stores/group/types"

import GroupsModel from "@models/groups"
import {
	createDefaultChannels,
	createDefaultMembers,
} from "../../../stores/group/constants"
import { resolveCachedMembersUsers } from "../../../helpers/cache"
import db from "../../../db"

async function deferredCacheCheck(
	groupId: string,
	cached: CachedGroup,
	actions: GroupStoreActions,
	isCurrentGeneration: () => boolean,
) {
	try {
		const meta = await GroupsModel.meta(groupId)

		if (!isCurrentGeneration()) return

		if (cached.group?.__v < meta.group_v) {
			await actions.fetchGroup()
		}

		if (!isCurrentGeneration()) return

		const knownTotal = Math.max(
			cached.total_members ?? 0,
			cached.memberships?.length ?? 0,
		)
		if (knownTotal < (meta.total_members ?? 0)) {
			await actions.fetchMembers()
		}

		if (!isCurrentGeneration()) return

		if ((cached.channels?.total_items ?? 0) < (meta.total_channels ?? 0)) {
			await actions.fetchChannels()
		}
	} catch (err) {
		console.error("deferredCacheCheck failed", err)
	}
}

export default async function (
	this: LifecycleActions,
	groupId: string,
): Promise<void> {
	const generation = this.state.initGeneration + 1
	this.setState({ initGeneration: generation })

	const isCurrentGeneration = () => this.state.initGeneration === generation

	this.setState({
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

		if (!isCurrentGeneration()) return

		const cached: CachedGroup = {
			group: cachedGroup ?? null,
			channels: cachedChannelsDoc ?? null,
			memberships:
				cachedMemberships.length > 0 ? cachedMemberships : null,
			total_members: cachedTotalMembers > 0 ? cachedTotalMembers : null,
		}

		if (cached.group) {
			this.setState({ data: cached.group })
		}
		if (cached.channels) {
			this.setState({ channels: cached.channels })
		}
		if (cached.memberships) {
			const populatedMembers = await resolveCachedMembersUsers(
				cached.memberships,
			)
			this.setState({
				members: {
					items: populatedMembers,
					total_items:
						cached.total_members ?? populatedMembers.length,
					has_more: false,
				},
			})
			this.state.actions.evaluateConnections(populatedMembers)
			this.state.actions.evaluateDecorations(populatedMembers)
		}

		this.state.actions.syncRTCChannels().catch(console.error)

		const hasAllCache =
			cached.group && cached.channels && cached.memberships

		if (!hasAllCache) {
			const promises = []

			if (!cached.group) promises.push(this.state.actions.fetchGroup())
			if (!cached.channels)
				promises.push(this.state.actions.fetchChannels())
			if (!cached.memberships)
				promises.push(this.state.actions.fetchMembers())

			await Promise.all(promises)
		}

		if (isCurrentGeneration()) {
			this.setState({ loading: false })
		}

		if (hasAllCache && isCurrentGeneration()) {
			deferredCacheCheck(
				groupId,
				cached,
				this.state.actions,
				isCurrentGeneration,
			).catch(console.error)
		}
	} catch (err: any) {
		if (isCurrentGeneration()) {
			console.error("Failed to init group", err)
			this.setState({ error: err, loading: false })
		}
	}
}
