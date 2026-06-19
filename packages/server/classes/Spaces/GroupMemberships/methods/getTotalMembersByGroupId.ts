import type GroupMemberships from "../index"

export default async function (
	this: typeof GroupMemberships,
	group_id: string,
) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	const reg = await this.modelCounter.findOne({
		group_id: group_id,
	})

	if (reg?.counter) {
		// @ts-ignore
		return parseInt(reg.counter)
	}

	return 0
}
