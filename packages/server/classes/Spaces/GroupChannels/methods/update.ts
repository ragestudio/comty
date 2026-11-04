import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"
import type { Group } from "@db/groups"
import type GroupChannels from "../index"

const NAME_MIN_LENGTH = 3
const NAME_MAX_LENGTH = 64
const DESCRIPTION_MAX_LENGTH = 500
const MAX_USER_LIMIT = 99

const parseUserLimit = (value: unknown): string => {
	const limit = Number.parseInt(String(value ?? 0), 10)

	if (!Number.isFinite(limit) || limit < 0 || limit > MAX_USER_LIMIT) {
		throw new OperationError(
			400,
			`Channel user_limit must be between 0 and ${MAX_USER_LIMIT}`,
		)
	}

	return String(limit)
}

export default async function (
	this: typeof GroupChannels,
	group: Group,
	channel_id: string,
	payload: any,
	user_id?: string,
) {
	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	if (typeof channel_id !== "string") {
		throw new OperationError(400, "channel_id must be a string")
	}

	const channel = await this.get(group, channel_id)

	if (!channel) {
		throw new OperationError(404, "Channel not found")
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
				"You are not allowed to update a channel in this group",
			)
		}
	}

	if (payload.name !== undefined) {
		if (typeof payload.name !== "string") {
			throw new OperationError(400, "Channel name must be a string")
		}

		const name = payload.name.trim()

		if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
			throw new OperationError(
				400,
				`Channel name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters`,
			)
		}

		channel.name = name
	}

	if (payload.description !== undefined) {
		if (
			payload.description !== null &&
			typeof payload.description !== "string"
		) {
			throw new OperationError(400, "Channel description must be a string")
		}

		channel.description = (payload.description ?? "")
			.trim()
			.slice(0, DESCRIPTION_MAX_LENGTH)
	}

	if (payload.params !== undefined && channel.kind === "voice") {
		if (!payload.params || typeof payload.params !== "object") {
			throw new OperationError(400, "Channel params must be an object")
		}

		// the odm cannot encode empty maps, store a zero limit instead
		channel.params = {
			user_limit: parseUserLimit(payload.params.user_limit),
		}
	}

	await channel.save()

	if (global.websockets) {
		try {
			global.websockets.senders.toTopic(
				`group:${group._id}`,
				`group:${group._id}:channel:updated`,
				channel.toRaw(),
			)
		} catch (error) {
			console.error("Failed to send event to group topic", error)
		}
	}

	return channel
}
