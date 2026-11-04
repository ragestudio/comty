import type { GroupBan } from "@comty/shared/types/spaces/ban"

import GroupBansModel from "@db/group_bans"

const REASON_MAX_LENGTH = 300

export default class GroupBans {
	static get model() {
		return GroupBansModel
	}

	static async get(
		group_id: string,
		user_id: string,
	): Promise<GroupBan | null> {
		if (typeof group_id !== "string" || typeof user_id !== "string") {
			throw new OperationError(400, "group_id and user_id must be strings")
		}

		const ban = await GroupBansModel.findOne(
			{
				group_id: group_id,
				user_id: user_id,
			},
			{
				raw: true,
			},
		)

		return (ban as GroupBan) ?? null
	}

	static async list(group_id: string): Promise<GroupBan[]> {
		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		const bans = await GroupBansModel.find(
			{
				group_id: group_id,
			},
			{
				raw: true,
			},
		)

		return bans as GroupBan[]
	}

	static async create(payload: {
		group_id: string
		user_id: string
		banned_by?: string
		reason?: string
	}): Promise<GroupBan> {
		const { group_id, user_id, banned_by } = payload

		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		if (typeof user_id !== "string") {
			throw new OperationError(400, "user_id must be a string")
		}

		const reason =
			typeof payload.reason === "string"
				? payload.reason.trim().slice(0, REASON_MAX_LENGTH)
				: undefined

		let ban = await GroupBansModel.findOne({
			group_id: group_id,
			user_id: user_id,
		})

		if (ban) {
			ban.banned_by = banned_by
			ban.reason = reason
		} else {
			ban = GroupBansModel.obj({
				group_id: group_id,
				user_id: user_id,
				banned_by: banned_by,
				reason: reason,
				created_at: new Date(),
			})
		}

		await ban.save()

		return ban.toRaw() as GroupBan
	}

	static async remove(
		group_id: string,
		user_id: string,
	): Promise<{ success: boolean }> {
		if (typeof group_id !== "string" || typeof user_id !== "string") {
			throw new OperationError(400, "group_id and user_id must be strings")
		}

		const ban = await GroupBansModel.findOne({
			group_id: group_id,
			user_id: user_id,
		})

		if (!ban) {
			return { success: false }
		}

		await ban.delete()

		return { success: true }
	}
}
