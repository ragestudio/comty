import { Widget } from "@models"
import compileWidgetCode from "@utils/compileWidgetCode"
import path from "path"

export default async (
    widgetId,
    {
        useCache = true,
        origin = null,
    }
) => {
    if (!widgetId) {
        throw new Error("Widget ID not defined.")
    }
    if (!origin) {
        throw new Error("Origin not defined.")
    }

    // try to find Widget
    const widget = await Widget.findOne({
        _id: widgetId,
    }).catch(() => {
        return null
    })

    if (!widget) {
        throw new Error("Widget not found.")
    }

    if (!widget.manifest.main) {
        throw new Error("Widget entry file not defined")
    }

    const requestedVersion = widgetId.split("@")[1] ?? widget.manifest.version

    let widgetCode = null

    const finalOrigin = `${origin}/static/widgets/${widgetId}@${requestedVersion}/`
    const remotePath = `/widgets/${widgetId}@${requestedVersion}/`

    const remoteEntyFilePath = path.join(remotePath, widget.manifest.main)

    if (useCache) {
        widgetCode = await global.redis.get(`${origin}:widget:${widgetId}@${requestedVersion}}`)
    }

    if (!widgetCode) {
        try {
            widgetCode = await new Promise(async (resolve, reject) => {
                await global.storage.getObject(process.env.S3_BUCKET, remoteEntyFilePath, (error, dataStream) => {
                    if (error) {
                        return reject(error)
                    }

                    let data = ""

                    dataStream.on("data", (chunk) => {
                        data += chunk
                    })

                    dataStream.on("end", () => {
                        resolve(data)
                    })

                    dataStream.on("error", (error) => {
                        reject(error)
                    })
                })
            })
        } catch (error) {
            throw new Error(`Unable to fetch widget code. ${error.message}`)
        }

        try {
            console.log(`🔌 [widget:${widgetId}] Compiling widget code...`)

            widgetCode = await compileWidgetCode(widgetCode, widget.manifest, finalOrigin)

            await global.redis.set(`${origin}:widget:${widgetId}@${requestedVersion}}`, widgetCode)
        } catch (error) {
            throw new Error(`Unable to transform widget code. ${error.message}`)
        }
    }

    return widgetCode
}