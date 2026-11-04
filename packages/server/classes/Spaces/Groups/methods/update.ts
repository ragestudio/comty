import type { Group } from "@db/groups"
import type Groups from "../index"
import { Doc } from "@ragestudio/scylla-odm/types"

const NAME_MIN_LENGTH = 3
const NAME_MAX_LENGTH = 64
const DESCRIPTION_MAX_LENGTH = 500
const URL_MAX_LENGTH = 2048

const REACHABILITY_VALUES = new Set(["public", "private"])

const parseTextField = (
	value: unknown,
	field: string,
	maxLength: number,
): string => {
	if (value === null || value === undefined) {
		return ""
	}

	if (typeof value !== "string") {
		throw new OperationError(400, `Group ${field} must be a string`)
	}

	const trimmed = value.trim()

	if (trimmed.length > maxLength) {
		throw new OperationError(
			400,
			`Group ${field} must be ${maxLength} characters or less`,
		)
	}

	return trimmed
}

export default async function (
	this: typeof Groups,
	group: Doc<Group>,
	payload: any,
) {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	if (!payload || typeof payload !== "object") {
		throw new OperationError(400, "payload must be provided")
	}

	if (payload.name !== undefined) {
		if (typeof payload.name !== "string") {
			throw new OperationError(400, "Group name must be a string")
		}

		const name = payload.name.trim()

		if (name.length < NAME_MIN_LENGTH) {
			throw new OperationError(
				400,
				`Group name must be at least ${NAME_MIN_LENGTH} characters`,
			)
		}

		if (name.length > NAME_MAX_LENGTH) {
			throw new OperationError(
				400,
				`Group name must be ${NAME_MAX_LENGTH} characters or less`,
			)
		}

		group.name = name
	}

	if (payload.description !== undefined) {
		group.description = parseTextField(
			payload.description,
			"description",
			DESCRIPTION_MAX_LENGTH,
		)
	}

	if (payload.icon !== undefined) {
		group.icon = parseTextField(payload.icon, "icon", URL_MAX_LENGTH)
	}

	if (payload.cover !== undefined) {
		group.cover = parseTextField(payload.cover, "cover", URL_MAX_LENGTH)
	}

	if (payload.reachability !== undefined) {
		if (!REACHABILITY_VALUES.has(payload.reachability)) {
			throw new OperationError(
				400,
				"Group reachability must be public or private",
			)
		}

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
