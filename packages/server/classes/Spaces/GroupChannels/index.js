import getMethod from "./methods/get"
import getAllByGroupIdMethod from "./methods/getAllByGroupId"
import createMethod from "./methods/create"
import updateMethod from "./methods/update"
import deleteMethod from "./methods/delete"
import orderMethod from "./methods/order"

export default class GroupChannels {
	static get model() {
		return global.scylla.model("group_channels")
	}

	static get orderModel() {
		return global.scylla.model("channel_orders")
	}

	static kinds = {
		chat: "chat",
		voice: "voice",
	}

	static get = getMethod.bind(this)
	static getAllByGroupId = getAllByGroupIdMethod.bind(this)

	static create = createMethod.bind(this)
	static update = updateMethod.bind(this)
	static delete = deleteMethod.bind(this)
	static order = orderMethod.bind(this)
}
