import Groups from "@classes/Groups"
import GroupChannels from "@classes/GroupChannels"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const group = await Groups.get(
			req.params.group_id,
			req.auth.session.user_id,
		)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		let channels = await GroupChannels.getByGroupId(
			req.params.group_id,
			req.auth.session.user_id,
		)

		channels = channels.map((channel) => channel.toJSON())

		const channelOrder = await Groups.channelOrderModel
			.findOneAsync({
				group_id: req.params.group_id,
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

		return channels
	},
}
