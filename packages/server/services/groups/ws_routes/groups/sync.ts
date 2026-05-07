import { DateTime, Duration } from "luxon"

import MembershipsModel from "@db/group_memberships_ref"

type SyncPayload = {
	group_id: string
	data_sync_time?: string
	channels_sync_time?: string
	members_sync_time?: string
}

type EventBefore = {
	members?: any[]
}

type CacheMiss = {
	members?: boolean
	channels?: boolean
}

const MAX_SYNC_TIME_DIFF_HOURS = 24
const MAX_NEW_MEMBERSHIPS_UNTIL_INVALIDATE = 10

export default {
	useContexts: ["scylla"],
	fn: async (client: RTEClient, payload: SyncPayload, ctx: any) => {
		if (!payload.group_id) {
			throw new OperationError(400, "Missing group_id to sync with")
		}

		console.log("groups::sync", payload)

		let eventsBeforeSyncTime: EventBefore = {}
		let cacheMiss: CacheMiss = {}

		if (payload.members_sync_time) {
			if (
				DateTime.fromISO(payload.members_sync_time).diffNow().hours >
				MAX_SYNC_TIME_DIFF_HOURS
			) {
				cacheMiss.members = true
			} else {
				const newMemberships = await MembershipsModel.find(
					{
						group_id: payload.group_id,
						created_at: {
							$gt: new Date(payload.members_sync_time),
						},
					},
					{
						limit: MAX_NEW_MEMBERSHIPS_UNTIL_INVALIDATE + 1,
					},
				)

				if (
					newMemberships.length > MAX_NEW_MEMBERSHIPS_UNTIL_INVALIDATE
				) {
					cacheMiss.members = true
				} else {
					eventsBeforeSyncTime.members = newMemberships
				}
			}
		}

		console.log({ eventsBeforeSyncTime, cacheMiss })

		return {
			cache_miss: cacheMiss,
			events: eventsBeforeSyncTime,
		}
	},
}
