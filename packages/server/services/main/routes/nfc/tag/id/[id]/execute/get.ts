import type API from "@services/main/main.service"
import NFCTag from "@db_models/NFCTags"

type RouteParams = {
	id: string
}

export default defineRoute<API>()({
	fn: async (req, res) => {
		const { id } = req.params as RouteParams

		let tag = await NFCTag.findOne({
			_id: id,
		})

		if (!tag) {
			return res.status(404).json({
				error: "Cannot find tag",
			})
		}

		if (tag.active === false) {
			return res.status(404).json({
				error: "Tag is not active",
			})
		}

		console.log(tag)

		// existing bug: result is never assigned
		let result: any

		switch (tag.behavior.type) {
			case "badge": {
				return res.redirect(
					`https://${tag.origin}/badge/${tag.user_id}`,
				)
			}
			case "url": {
				if (!tag.behavior.value.startsWith("https://")) {
					tag.behavior.value = `https://${tag.behavior.value}`
				}

				return res.redirect(tag.behavior.value)
			}
			case "random_list": {
				const values = result.behavior.value.split(";")

				const index = Math.floor(Math.random() * values.length)

				let randomURL = values[index]

				if (!randomURL.startsWith("https://")) {
					randomURL = `https://${randomURL}`
				}

				return res.redirect(values[index])
			}
			case "default": {
				return res.json({
					error: "Cannot execute tag",
					description: "Tag contains a command that cannot exist",
				})
			}
		}
	},
})
