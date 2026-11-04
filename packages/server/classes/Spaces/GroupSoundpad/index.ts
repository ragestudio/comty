import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"
import type { Document } from "mongoose"

import GroupSoundpadItem from "@db_models/groupSoundpadItem"

import BuiltInItems from "./defaults.json"

const ICON_MAX_LENGTH = 16
const NAME_MAX_LENGTH = 48
const SRC_MAX_LENGTH = 2048

export default class GroupSoundpad {
	static getBuiltInItems(): SoundpadItemPayload[] {
		return BuiltInItems
	}

	static async getItems(group_id: string): Promise<any[]> {
		const groupItems = await GroupSoundpadItem.find({
			group_id: group_id,
		})

		return [
			...groupItems.map((item) => ({
				...item.toObject(),
				built_in: false,
			})),
			...GroupSoundpad.getBuiltInItems().map((item) => ({
				...item,
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
		const { _id, group_id, icon, name, src } = payload

		if (!group_id) {
			throw new OperationError(400, "Missing group_id")
		}

		const queryFilter = {
			_id: _id,
			group_id: group_id,
		}

		const item = await GroupSoundpadItem.findOne(queryFilter)

		if (!item) {
			throw new OperationError(404, "Item not found")
		}

		return await GroupSoundpadItem.findOneAndUpdate(queryFilter, {
			group_id: group_id,
			icon: icon,
			name: name,
			src: src,
		})
	}

	static async addItem(payload: SoundpadItemPayload): Promise<any> {
		const { group_id, user_id } = payload

		if (!group_id) {
			throw new OperationError(400, "Missing group_id")
		}

		if (!user_id) {
			throw new OperationError(400, "Missing user_id")
		}

		if (
			typeof payload.icon !== "string" ||
			payload.icon.trim().length === 0
		) {
			throw new OperationError(400, "Missing icon")
		}

		const icon = payload.icon.trim().slice(0, ICON_MAX_LENGTH)

		if (
			typeof payload.name !== "string" ||
			payload.name.trim().length === 0
		) {
			throw new OperationError(400, "Missing name")
		}

		const name = payload.name.trim().slice(0, NAME_MAX_LENGTH)

		if (
			typeof payload.src !== "string" ||
			payload.src.length > SRC_MAX_LENGTH
		) {
			throw new OperationError(400, "Invalid src")
		}

		try {
			const url = new URL(payload.src)

			if (url.protocol !== "https:") {
				throw new Error("invalid protocol")
			}
		} catch {
			throw new OperationError(400, "src must be a valid HTTPS URL")
		}

		const soundpadItem = await GroupSoundpadItem.create({
			group_id: group_id,
			user_id: user_id,
			icon: icon,
			name: name,
			src: payload.src,
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
