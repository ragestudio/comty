import { Widget } from "@models"

export default async (req, res) => {
    let { limit = 20, offset = 0, keywords } = req.query

    keywords = JSON.parse(keywords ?? "{}")

    // remove empty keywords
    Object.keys(keywords).forEach((key) => {
        if (keywords[key] === "") {
            delete keywords[key]
        }
    })

    console.log("Searching with keywords:", keywords)

    const query = {
        public: true,
    }

    // inclide keywords for search in manifest
    Object.keys(keywords).forEach((key) => {
        query[`manifest.${key}`] = {
            $regex: keywords[key],
            $options: "i",
        }
    })

    let widgets = await Widget.find(query)
        .limit(Number(limit))
        .skip(Number(offset))

    widgets = widgets.map((widget) => {
        widget.manifest._id = widget._id
        widget.manifest.user_id = widget.user_id

        return widget
    })

    return res.json(widgets)
}