import getMethod from "./methods/get"
import getAllByGroupIdMethod from "./methods/getAllByGroup"
import createMethod from "./methods/create"
import updateMethod from "./methods/update"
import deleteMethod from "./methods/delete"
import orderMethod from "./methods/order"

import GroupChannelsModel from "@db/group_channels"
import ChannelOrdersModel from "@db/channel_orders"
import getTotalByGroupId from "./methods/getTotalByGroup"

export default class GroupChannels {
	static get model() {
		return GroupChannelsModel
	}

	static get orderModel() {
		return ChannelOrdersModel
	}

	static kinds = {
		chat: "chat",
		voice: "voice",
	}

	static get = getMethod.bind(this) as OmitThisParameter<typeof getMethod>
	static getAllByGroup = getAllByGroupIdMethod.bind(
		this,
	) as OmitThisParameter<typeof getAllByGroupIdMethod>
	static getTotalByGroup = getTotalByGroupId.bind(this) as OmitThisParameter<
		typeof getTotalByGroupId
	>

	static create = createMethod.bind(this) as OmitThisParameter<
		typeof createMethod
	>
	static update = updateMethod.bind(this) as OmitThisParameter<
		typeof updateMethod
	>
	static delete = deleteMethod.bind(this) as OmitThisParameter<
		typeof deleteMethod
	>
	static order = orderMethod.bind(this) as OmitThisParameter<
		typeof orderMethod
	>
}
