import { NFCTag } from "@db_models"

export default async (req, res) => {
	let tag = await NFCTag.findOne({
		_id: req.params.id,
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

	switch (tag.behavior.type) {
		case "badge": {
			return res.redirect(`https://${tag.origin}/badge/${tag.user_id}`)
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
}
