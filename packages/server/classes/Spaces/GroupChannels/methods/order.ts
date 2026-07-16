import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"
import type { Group } from "@db/groups"
import type GroupChannels from "../index"

export default async function (
	this: typeof GroupChannels,
	group: Group,
	order_ids: string[],
	user_id?: string,
) {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	if (!Array.isArray(order_ids)) {
		throw new OperationError(400, "order_ids must be an array")
	}

	if (typeof user_id === "string") {
		if (
			!(await GroupPermissions.canPerformAction(
				user_id,
				group,
				"MANAGE_CHANNELS",
			))
		) {
			throw new OperationError(
				403,
				"You are not allowed to order channels in this group",
			)
		}
	}

	let order = await this.orderModel.update({
		group_id: group._id,
		order: order_ids,
	})

	if (global.websockets) {
		try {
			global.websockets.senders.toTopic(
				`group:${group._id}`,
				`group:${group._id}:channels:ordered`,
				order_ids,
			)
		} catch (error) {
			console.error("Failed to send event to group topic", error)
		}
	}

	return order
}
