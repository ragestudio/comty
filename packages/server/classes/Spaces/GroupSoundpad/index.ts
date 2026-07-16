import * as db_models from "@db_models"
const { GroupSoundpadItem } = db_models as any

export interface SoundpadItemPayload {
	group_id: string
	user_id: string
	icon: string
	name: string
	src: string
}

export default class GroupSoundpad {
	static getBuiltInItems(): any[] {
		return [
			{
				_id: "000001",
				group_id: "comty",
				user_id: "comty",
				icon: "💩",
				name: "Funny Fart",
				src: "https://storage.ragestudio.net/comty-static-assets/soundpacks/isma/farti.mp3",
			},
			{
				_id: "000002",
				group_id: "comty",
				user_id: "comty",
				icon: "😽",
				name: "El reportedo",
				src: "https://storage.ragestudio.net:443/comty-cdn/627d4b628cf4b82edd0864ff/9bf80fd874b7a7d060ceee4a4933192a155d4cf9ba97997dee8faf2f15b6442b",
			},
			{
				_id: "000003",
				group_id: "comty",
				user_id: "comty",
				icon: "📣",
				name: "Real DJ",
				src: "https://storage.ragestudio.net:443/comty-cdn/627d4b628cf4b82edd0864ff/88f4d54094cab00d2d260e4be801152f8587c2c41c7cb69b1f34759cb08678ef",
			},
			{
				_id: "000004",
				group_id: "comty",
				user_id: "comty",
				icon: "🎙️",
				name: "Casi vivo",
				src: "https://storage.ragestudio.net/comty-static-assets/soundpad/ba.ogg",
			},
			{
				_id: "000005",
				group_id: "comty",
				user_id: "comty",
				icon: "🙂‍↕️",
				name: "Ascension to heaven",
				src: "https://storage.ragestudio.net/comty-static-assets/soundpad/dt.ogg",
			},
			{
				_id: "000006",
				group_id: "comty",
				user_id: "comty",
				icon: "🎪",
				name: "Funny song",
				src: "https://storage.ragestudio.net/comty-static-assets/soundpad/funny_song.ogg",
			},
		]
	}

	static async getItems(group_id: string): Promise<any[]> {
		const groupItems = await GroupSoundpadItem.find({
			group_id: group_id,
		})

		return [...groupItems, ...GroupSoundpad.getBuiltInItems()]
	}

	static async getItem(payload: {
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

		return await GroupSoundpadItem.findOne({
			_id: _id,
			group_id: group_id,
		})
	}

	static async addItem(payload: SoundpadItemPayload): Promise<any> {
		const { group_id, user_id, icon, name, src } = payload

		if (!group_id) {
			throw new OperationError(400, "Missing group_id")
		}

		if (!user_id) {
			throw new OperationError(400, "Missing user_id")
		}

		if (!icon) {
			throw new OperationError(400, "Missing icon")
		}

		if (!src) {
			throw new OperationError(400, "Missing src")
		}

		let soundpadItem = await GroupSoundpadItem.create({
			group_id: group_id,
			user_id: user_id,
			icon: icon,
			name: name,
			src: src,
			created_at: new Date(),
		})

		return soundpadItem
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
