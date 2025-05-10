import MusicModel from "comty.js/models/music"

export default class ComtyMusicServiceInterface {
	static id = "default"

	resolve = async (manifest) => {
		if (typeof manifest === "string" && manifest.startsWith("https://")) {
			return {
				source: manifest.source,
				service: "default",
			}
		}

		if (typeof manifest === "string") {
			manifest = {
				_id: manifest,
				service: ComtyMusicServiceInterface.id,
			}
		}

		const track = await MusicModel.getTrackData(manifest._id)

		return track
	}

	resolveLyrics = async (manifest, options) => {
		return await MusicModel.getTrackLyrics(manifest._id, options)
	}

	resolveOverride = async (manifest) => {
		// not supported yet for comty music service
		return {}
	}

	isItemFavorited = async (manifest, itemType) => {
		return await MusicModel.isItemFavorited(itemType, manifest._id)
	}

	toggleItemFavorite = async (manifest, itemType, to) => {
		return await MusicModel.toggleItemFavorite(itemType, manifest._id, to)
	}
}
