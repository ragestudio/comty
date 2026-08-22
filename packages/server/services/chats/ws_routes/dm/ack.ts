import type API from "@services/chats/chats.service"
import ChannelAcksModel from "@db/channel_acks"
import NotificationsModel from "@db/notifications"

export default defineRoute<API, "ws">()({
	useContexts: ["server", "scylla"] as const,
	fn: async (client, payload, ctx) => {
		if (!client.userId) {
			throw new OperationError(400, "Missing userId")
		}

		if (!payload.reference_id) {
			throw new OperationError(400, "Missing reference_id")
		}

		if (!payload.message_id) {
			throw new OperationError(400, "Missing message_id")
		}

		const user_id = client.userId
		const { reference_id, message_id } = payload

		// update or insert the channel watermark
		const ackObj = ChannelAcksModel.obj({
			user_id: user_id,
			reference_id: reference_id,
			last_read_message_id: message_id,
			updated_at: new Date(),
		})

		await ackObj.save()

		// delete explicit notifications for this user and reference_id
		const userNotifications = await NotificationsModel.find({
			user_id: user_id,
		})

		const toDelete = userNotifications.filter(
			(n) => n.reference_id === reference_id,
		)

		if (toDelete.length > 0) {
			const batch = ctx.scylla.batch()

			for (const notif of toDelete) {
				NotificationsModel.batch.delete(batch, {
					user_id,
					_id: notif._id,
				})
			}

			await batch.execute()
		}

		// sync all user clients to clear the UI
		ctx.server.engine.ws.senders.toUserId(
			user_id,
			"notification:ack:sync",
			{
				reference_id,
				message_id,
			},
		)
	},
})
