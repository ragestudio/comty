import { Track } from "@db_models"

export default {
	key: "tracks",
	model: Track,
	query: (keywords) => {
		return {
			$or: [{ title: new RegExp(keywords, "i") }],
		}
	},
}
