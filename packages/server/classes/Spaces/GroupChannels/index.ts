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

	static get = getMethod.bind(this)
	static getAllByGroup = getAllByGroupIdMethod.bind(this)
	static getTotalByGroup = getTotalByGroupId.bind(this) as OmitThisParameter<
		typeof getTotalByGroupId
	>

	static create = createMethod.bind(this)
	static update = updateMethod.bind(this)
	static delete = deleteMethod.bind(this)
	static order = orderMethod.bind(this)
}
