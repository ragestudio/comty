export default async function (group, payload) {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	if (payload.name) {
		group.name = payload.name
	}

	if (payload.description) {
		group.description = payload.description
	}

	if (payload.icon) {
		group.icon = payload.icon
	}

	if (payload.cover) {
		group.cover = payload.cover
	}

	if (payload.reachability) {
		group.reachability = payload.reachability
	}

	await group.saveAsync()

	return group
}
