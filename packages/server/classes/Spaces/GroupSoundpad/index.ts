import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"
import type { Document } from "mongoose"

import GroupSoundpadItem from "@db_models/groupSoundpadItem"

import { normalizeSoundpadItem } from "@shared-classes/Spaces/Soundpad/validation"
import { assertSoundpadDuration } from "@shared-classes/Spaces/Soundpad/duration"

import BuiltInItems from "./defaults.json"

export default class GroupSoundpad {
	static getBuiltInItems(): SoundpadItemPayload[] {
		return BuiltInItems
	}

	static async getItems(group_id: string): Promise<any[]> {
		const groupItems = await GroupSoundpadItem.find({
			group_id: group_id,
		}).sort({
			created_at: -1,
		})

		return [
			...groupItems.map((item) => ({
				...item.toObject(),
				scope: "group",
				built_in: false,
			})),
			...GroupSoundpad.getBuiltInItems().map((item) => ({
				...item,
				scope: "builtin",
				built_in: true,
			})),
		]
	}

	static async getItem(payload: {
		_id: string
		group_id: string
	}): Promise<Document<typeof GroupSoundpadItem>> {
		const { _id, group_id } = payload

		if (!_id) {
			throw new OperationError(400, "Missing _id")
		}

		if (!group_id) {
			throw new OperationError(400, "Missing group_id")
		}

		return await GroupSoundpadItem.findOne({
			_id: _id,
			group_id: group_id,
		})
	}

	static async updateItem(payload: SoundpadItemPayload) {
		const { _id, group_id } = payload

		if (!group_id) {
			throw new OperationError(400, "Missing group_id")
		}

		const item = normalizeSoundpadItem(payload)

		await assertSoundpadDuration(item.src)

		const queryFilter = {
			_id: _id,
			group_id: group_id,
		}

		const update = await GroupSoundpadItem.findOneAndUpdate(
			queryFilter,
			{
				group_id: group_id,
				...item,
			},
			{
				new: true,
			},
		)

		if (!update) {
			throw new OperationError(404, "Item not found")
		}

		return update
	}

	static async addItem(payload: SoundpadItemPayload): Promise<any> {
		const { group_id, user_id } = payload

		if (!group_id) {
			throw new OperationError(400, "Missing group_id")
		}

		if (!user_id) {
			throw new OperationError(400, "Missing user_id")
		}

		const item = normalizeSoundpadItem(payload)

		await assertSoundpadDuration(item.src)

		const soundpadItem = await GroupSoundpadItem.create({
			group_id: group_id,
			user_id: user_id,
			...item,
			created_at: new Date(),
		})

		await soundpadItem.save()

		return soundpadItem.toObject()
	}

	static async removeItem(payload: {
		_id: string
		group_id: string
	}): Promise<any> {
		const { _id, group_id } = payload

		if (!_id) {
			throw new OperationError(400, "Missing _id")
		}

		if (!group_id) {
			throw new OperationError(400, "Missing group_id")
		}

		return await GroupSoundpadItem.deleteOne({
			_id: _id,
			group_id: group_id,
		})
	}
}
