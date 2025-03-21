import { Extension } from "@db_models"

export default {
	key: "extensions",
	model: Extension,
	query: (keywords) => {
		const [name, version] = keywords.split("@")

		const build = {
			name: { $regex: name, $options: "i" },
		}

		if (version) {
			build.version = { $regex: version, $options: "i" }
		}

		return build
	},
}
