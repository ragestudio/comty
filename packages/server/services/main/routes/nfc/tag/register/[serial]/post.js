import { NFCTag } from "@db_models"

const allowedUpdateFields = [
	"user_id",
	"alias",
	"active",
	"behavior",
	"icon",
	"origin",
]

function buildEndpoint(id) {
	return `${process.env.NFC_TAG_ENDPOINT}/${id}/execute`
}

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		let tag = await NFCTag.findOne({
			serial: req.params.serial,
		})

		const user_id = req.auth.session.user_id

		if (!tag) {
			tag = new NFCTag({
				user_id: user_id,
				owner_id: user_id,
				serial: req.params.serial,
				alias: req.body.alias,
				behavior: req.body.behavior,
				active: req.body.active,
				origin: req.body.origin,
			})

			tag.endpoint_url = buildEndpoint(tag._id.toString())

			await tag.save()
		} else {
			tag = tag.toObject()

			if (req.user) {
				if (tag.user_id !== user_id) {
					return res.status(403).json({
						error: `You do not own this tag`,
					})
				}
			}

			let newData = {}

			tag.endpoint_url = buildEndpoint(tag._id.toString())
			newData.endpoint_url = tag.endpoint_url

			for (let field of allowedUpdateFields) {
				if (req.body[field]) {
					tag[field] = req.body[field]
					newData[field] = req.body[field]
				}

				await NFCTag.findOneAndUpdate(
					{
						serial: req.params.serial,
					},
					newData,
				)
			}
		}

		return tag
	},
}
