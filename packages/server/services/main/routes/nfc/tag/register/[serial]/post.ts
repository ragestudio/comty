import type API from "@services/main/main.service"
import NFCTag from "@db_models/NFCTags"

const allowedUpdateFields = [
	"user_id",
	"alias",
	"active",
	"behavior",
	"icon",
	"origin",
]

type RouteParams = {
	serial: string
}

type RouteBody = {
	alias?: string
	behavior?: Record<string, any>
	active?: boolean
	origin?: string
}

function buildEndpoint(id: string) {
	return `${process.env.NFC_TAG_ENDPOINT}/${id}/execute`
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const { serial } = req.params as RouteParams
		const body = (req.body ?? {}) as RouteBody

		let tag: any = await NFCTag.findOne({
			serial: serial,
		})

		const user_id = req.auth.session.user_id

		if (!tag) {
			tag = new NFCTag({
				user_id: user_id,
				owner_id: user_id,
				serial: serial,
				alias: body.alias,
				behavior: body.behavior,
				active: body.active,
				origin: body.origin,
			})

			tag.endpoint_url = buildEndpoint(tag._id.toString())

			await tag.save()
		} else {
			tag = tag.toObject()

			if ((req as any).user) {
				if (tag.user_id !== user_id) {
					return res.status(403).json({
						error: `You do not own this tag`,
					})
				}
			}

			let newData: Record<string, any> = {}

			tag.endpoint_url = buildEndpoint(tag._id.toString())
			newData.endpoint_url = tag.endpoint_url

			for (let field of allowedUpdateFields) {
				if (body[field]) {
					tag[field] = body[field]
					newData[field] = body[field]
				}

				await NFCTag.findOneAndUpdate(
					{
						serial: serial,
					},
					newData,
				)
			}
		}

		return tag
	},
})
