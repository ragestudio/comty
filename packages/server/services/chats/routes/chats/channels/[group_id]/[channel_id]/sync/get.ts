import type API from "@services/chats/chats.service"

import User from "@db_models/user"
import ChannelLogModel from "@db/channel_log"
import MessageModel from "@db/channel_messages"

export default defineRoute<API>()({
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	useContexts: ["groupChannels"] as const,
	fn: async (req, res, ctx) => {
		const { group_id, channel_id } = req.params
		let { last_synced_at, last_message_id } = req.query

		// Verify channel access
		await ctx.groupChannels.get(
			group_id,
			channel_id,
			// @ts-ignore
			req.auth.session.user_id,
		)

		const syncFrom = last_synced_at
			? new Date(parseInt(last_synced_at))
			: new Date(0)

		// fetch logs for deletions and updates since last sync
		const logs = await ChannelLogModel.find(
			{
				channel_id,
				timestamp: { $gt: syncFrom },
			},
			{ raw: true },
		)

		// fetch updated messages content
		const updatedMessageIds = logs
			.filter((l) => l.type === "message:updated")
			.map((l) => l.target_id)

		let updatedMessages = []

		if (updatedMessageIds.length > 0) {
			updatedMessages = await MessageModel.find(
				{
					channel_id,
					_id: { $in: updatedMessageIds },
				},
				{ raw: true },
			)
		}

		// fetch new messages since last message id
		const msgQuery = {
			channel_id,
		}

		if (last_message_id) {
			msgQuery["_id"] = { $gt: last_message_id }
		}

		const newMessages = await MessageModel.find(msgQuery, { raw: true })

		const allMessages = [...newMessages, ...updatedMessages]

		let users = []
		if (allMessages.length > 0) {
			users = await User.find({
				_id: {
					$in: allMessages
						.map((m) => m.user_id)
						.filter((id) => id !== "0"), // filter out the "0" user_id, is a system user
				},
			}).select("_id username public_name roles avatar cover bot bot_id")
		}

		return {
			logs: logs.map((l) => ({
				type: l.type,
				target_id: l.target_id,
				timestamp: l.timestamp,
			})),
			newMessages,
			updatedMessages,
			users,
		}
	},
})
