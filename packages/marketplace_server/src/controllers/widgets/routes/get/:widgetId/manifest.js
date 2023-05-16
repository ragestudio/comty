import { Widget } from "@models"

export default async (req, res) => {
    const widget_id = req.params.widgetId

    const widget = await Widget.findOne({
        _id: widget_id,
    }).catch(() => {
        return false
    })

    if (!widget) {
        return res.status(404).json({
            error: "Widget not found",
        })
    }

    return res.status(200).json({
        ...widget.manifest,
        user_id: widget.user_id,
        _id: widget_id,
    })
}