import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"

export default async function (group, order_ids, user_id) {
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

	let order = await this.orderModel.updateAsync(
		{ group_id: group._id },
		{
			order: order_ids,
		},
	)

	return order
}
