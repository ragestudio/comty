import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"
import { MAX_USER_SOUNDPAD_ITEMS } from "@comty/shared/types/spaces/soundpad"

import UserSoundpadItem from "@db_models/userSoundpadItem"

import { normalizeSoundpadItem } from "@shared-classes/Spaces/Soundpad/validation"
import { assertSoundpadDuration } from "@shared-classes/Spaces/Soundpad/duration"

const withScope = (item: any) => ({
	...item,
	scope: "user",
	built_in: false,
})

export default class UserSoundpad {
	static async getItems(user_id: string): Promise<any[]> {
		if (!user_id) {
			throw new OperationError(400, "Missing user_id")
		}

		const items = await UserSoundpadItem.find({
			user_id: user_id,
		}).sort({
			created_at: -1,
		})

		return items.map((item) => withScope(item.toObject()))
	}

	static async getItem(payload: { _id: string; user_id: string }) {
		const { _id, user_id } = payload

		if (!_id) {
			throw new OperationError(400, "Missing _id")
		}

		if (!user_id) {
			throw new OperationError(400, "Missing user_id")
		}

		const item = await UserSoundpadItem.findOne({
			_id: _id,
			user_id: user_id,
		})

		if (!item) {
			throw new OperationError(404, "Item not found")
		}

		return withScope(item.toObject())
	}

	static async addItem(payload: SoundpadItemPayload): Promise<any> {
		const { user_id } = payload

		if (!user_id) {
			throw new OperationError(400, "Missing user_id")
		}

		const item = normalizeSoundpadItem(payload)

		const itemCount = await UserSoundpadItem.countDocuments({
			user_id: user_id,
		})

		if (itemCount >= MAX_USER_SOUNDPAD_ITEMS) {
			throw new OperationError(
				400,
				`You can only have ${MAX_USER_SOUNDPAD_ITEMS} sounds`,
			)
		}

		const duplicate = await UserSoundpadItem.findOne({
			user_id: user_id,
			src: item.src,
		})

		if (duplicate) {
			throw new OperationError(409, "Sound already added")
		}

		await assertSoundpadDuration(item.src)

		const soundpadItem = await UserSoundpadItem.create({
			user_id: user_id,
			...item,
			created_at: new Date(),
		})

		return withScope(soundpadItem.toObject())
	}

	static async updateItem(payload: SoundpadItemPayload): Promise<any> {
		const { _id, user_id } = payload

		if (!_id) {
			throw new OperationError(400, "Missing _id")
		}

		if (!user_id) {
			throw new OperationError(400, "Missing user_id")
		}

		const item = normalizeSoundpadItem(payload)

		await assertSoundpadDuration(item.src)

		const duplicate = await UserSoundpadItem.findOne({
			user_id: user_id,
			src: item.src,
			_id: { $ne: _id },
		})

		if (duplicate) {
			throw new OperationError(409, "Sound already added")
		}

		const update = await UserSoundpadItem.findOneAndUpdate(
			{
				_id: _id,
				user_id: user_id,
			},
			item,
			{
				new: true,
			},
		)

		if (!update) {
			throw new OperationError(404, "Item not found")
		}

		return withScope(update.toObject())
	}

	static async removeItem(payload: { _id: string; user_id: string }) {
		const { _id, user_id } = payload

		if (!_id) {
			throw new OperationError(400, "Missing _id")
		}

		if (!user_id) {
			throw new OperationError(400, "Missing user_id")
		}

		const result = await UserSoundpadItem.deleteOne({
			_id: _id,
			user_id: user_id,
		})

		return {
			success: result.deletedCount > 0,
		}
	}
}
