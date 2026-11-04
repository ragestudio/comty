import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"
import LastChannelMessageIdModel from "@db/group_channels_last_message_id"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("READ_CHANNELS")

		let channels = await GroupChannels.getAllByGroup(authz.group)

		channels = channels.map((channel) => channel.toRaw())

		const lastMessageIds = await Promise.all(
			channels.map((c) =>
				LastChannelMessageIdModel.findOne({ channel_id: c._id }).catch(
					() => null,
				),
			),
		)

		channels.forEach((c, index) => {
			if (lastMessageIds[index]) {
				c.last_message_id = lastMessageIds[index]._id
			}
		})

		const channelOrder = await GroupChannels.orderModel
			.findOne({
				group_id: authz.group._id,
			})
			.catch(() => null)

		if (channelOrder) {
			channels = channels.sort((a, b) => {
				const aIndex = channelOrder.order.indexOf(a._id)
				const bIndex = channelOrder.order.indexOf(b._id)

				if (aIndex === -1) {
					return 1
				}

				if (bIndex === -1) {
					return -1
				}

				return aIndex - bIndex
			})
		}

		return {
			total_items: channels.length,
			items: channels,
		}
	},
}
