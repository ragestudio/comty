import { NFCTag } from "@models"

const allowedUpdateFields = [
    "user_id",
    "alias",
    "active",
    "behavior",
    "icon",
]

export default {
    method: "POST",
    route: "/tag/:serial",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        let tag = await NFCTag.findOne({
            serial: req.params.serial
        })

        if (!tag) {
            tag = new NFCTag({
                user_id: req.user._id.toString(),
                owner_id: req.user._id.toString(),
                serial: req.params.serial,
                alias: req.body.alias,
                behavior: req.body.behavior,
                active: req.body.active,
            })

            tag.endpoint_url = `${process.env.NFC_TAG_ENDPOINT}/${tag._id.toString()}`

            await tag.save()
        } else {
            tag = tag.toObject()

            if (req.user) {
                if (tag.user_id !== req.user._id.toString()) {
                    return res.status(403).json({
                        error: `You do not own this tag`
                    })
                }
            }

            let newData = {}

            tag.endpoint_url = `${process.env.NFC_TAG_ENDPOINT}/${tag._id.toString()}`
            newData.endpoint_url = tag.endpoint_url

            for (let field of allowedUpdateFields) {
                if (req.body[field]) {
                    tag[field] = req.body[field]
                    newData[field] = req.body[field]
                }

                await NFCTag.findOneAndUpdate({
                    serial: req.params.serial
                }, newData)
            }
        }

        return res.json(tag)
    }
}