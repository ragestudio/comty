import getWidgetCode from "@utils/getWidgetCode"

export default async (req, res) => {
    const widgetId = req.params.widgetId

    const useCache = req.query["use-cache"] ? toBoolean(req.query["use-cache"]) : true

    const origin = `${toBoolean(process.env.FORCE_CODE_SSL) ? "https" : req.protocol}://${req.get("host")}`

    let widgetCode = await getWidgetCode(widgetId, {
        useCache,
        origin,
    }).catch((error) => {
        res.status(500).json({
            error: error.message,
        })

        return false
    })

    if (widgetCode) {
        res.setHeader("Content-Type", "application/javascript")
        return res.status(200).send(widgetCode)
    }
}