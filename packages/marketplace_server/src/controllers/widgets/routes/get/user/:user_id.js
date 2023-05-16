import { Widget } from "@models"

export default async (req, res) => {
    const { user_id } = req.params
    const { limit = 20, offset = 0 } = req.query

    const widgets = await Widget.find({
        user_id,
        public: true,
    })
        .limit(Number(limit))
        .skip(Number(offset))

    return res.json(widgets)
}