import type EvaluateActions from "./index"

import GroupsModel from "comty.js/endpoints/groups"
import { usersActions } from "@/users"
import { adapter } from "@/adapter"
import logger from "@comty/shared/utils/logger"

export default async function (this: EvaluateActions): Promise<void> {
	if (!this.state.groupId) return

	const currentGeneration = this.state.initGeneration

	try {
		const session = await adapter.sessionGetter().catch(() => null)
		const selfUserId = session?.user_id

		const response = await GroupsModel.rtc.getGroupState(this.state.groupId)
		if (currentGeneration !== this.state.initGeneration) return

		if (Array.isArray(response)) {
			const userIdsToEvaluate = new Set<string>()
			const usersToCache: any[] = []

			const statedChannels = response.reduce(
				(curr: Record<string, any>, channel: any) => {
					const clients = (channel.clients ?? []).map(
						(client: any) => ({
							...client,
							self: client.userId === selfUserId,
						}),
					)

					curr[channel._id] = { ...channel, clients }

					clients.forEach((client: any) => {
						if (client.userId) {
							userIdsToEvaluate.add(client.userId)
						}

						if (client.user?._id) {
							usersToCache.push(client.user)
						}
					})
					return curr
				},
				{},
			)

			if (usersToCache.length > 0) {
				usersActions.setUsers(usersToCache)
			}

			this.setState({ statedChannels })

			if (userIdsToEvaluate.size > 0) {
				void usersActions.ensure(userIdsToEvaluate)

				this.state.actions.evaluateDecorations(
					Array.from(userIdsToEvaluate),
				)
			}
		}
	} catch (err: any) {
		logger.error("syncRTCChannels failed", err)
	}
}
