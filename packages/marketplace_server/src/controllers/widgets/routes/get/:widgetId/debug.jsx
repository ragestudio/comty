import { Widget } from "@models"
import getWidgetCode from "@utils/getWidgetCode"

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

    const widgetCode = await getWidgetCode(widget_id, {
        useCache: false,
        origin: `${toBoolean(process.env.FORCE_CODE_SSL) ? "https" : req.protocol}://${req.get("host")}`,
    }).catch((error) => {
        res.status(500).json({
            error: error.message,
        })
        return false
    })

    // create a development web preview using react app

    return res.status(200).send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Widget Preview</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                
                <script>
                    window.__debugState = {
                        widgetCode: ${JSON.stringify(widgetCode)},
                    }
                </script>

                <script src="https://cdn.jsdelivr.net/npm/react/umd/react.development.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/react-dom/umd/react-dom.development.js"></script>
                <script src="http://localhost:3040/static/devScripts/main.jsx"></script>
            </head>
            <body>
            <h2>Widget Preview</h2>
                <div id="root"></div>
            </body>
        </html>
    `)
}