import { NFCTag } from "@db_models"

export default async (req, res) => {
    let tag = await NFCTag.findOne({
        _id: req.params.id
    })

    if (!tag) {
        return res.status(404).json({
            error: "Cannot find tag"
        })
    }

    switch (tag.behavior.type) {
        case "url": {
            if (!tag.behavior.value.startsWith("https://")) {
                tag.behavior.value = `https://${tag.behavior.value}`
            }

            return res.redirect(tag.behavior.value)
        }
        case "profile": {
            return new OperationError(501, `Not implemented.`)
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
    }
}