import { User, NFCTag } from "@models"

export default {
    method: "GET",
    route: "/tags/:id",
    fn: async (req, res) => {
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
            if (tag.user_id.toString() === req.user._id.toString()) {
                tag.is_owner = true
            }
        }

        tag.user = await User.findOne({
            _id: tag.user_id
        })

        return res.json(tag)
    }
}