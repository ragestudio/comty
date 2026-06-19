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

	// update the __v
	group.__v = (group.__v ?? 0) + 1

	await group.save()

	if (global.websockets) {
		try {
			global.websockets.senders.toTopic(
				`group:${group._id}`,
				`group:${group._id}:update`,
				group.toRaw(),
			)
		} catch (error) {
			console.error("Failed to send to group topic", error)
		}
	}

	return group
}
