import { Track } from "@db_models"

export default {
	key: "tracks",
	model: Track,
	query: (keywords) => {
		return {
			public: true,
			$or: [
				{
					title: new RegExp(keywords, "i"),
				},
				{
					artist: new RegExp(keywords, "i"),
				},
			],
		}
	},
}
