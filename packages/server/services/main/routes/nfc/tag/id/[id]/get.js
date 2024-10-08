import { User, NFCTag } from "@db_models"

export default async (req, res) => {
    let tag = await NFCTag.findOne({
        _id: req.params.id
    })

    if (!tag) {
        return res.status(404).json({
            error: "Cannot find tag"
        })
    }

    tag = tag.toObject()

    if (req.user) {
        if (tag.user_id.toString() === req.auth.session.user_id) {
            tag.is_owner = true
        }
    }

    tag.user = await User.findOne({
        _id: tag.user_id
    })

    return tag
}