import { Widget } from "@models"

import { transform } from "sucrase"
import UglifyJS from "uglify-js"

import path from "path"
import resolveUrl from "@utils/resolveUrl"
import replaceImportsWithRemoteURL from "@utils/replaceImportsWithRemoteURL"

async function compileWidgetCode(widgetCode, manifest, rootURL) {
    if (!widgetCode) {
        throw new Error("Widget code not defined.")
    }

    if (!manifest) {
        throw new Error("Manifest not defined.")
    }

    if (!rootURL) {
        throw new Error("Root URL not defined.")
    }

    let renderComponentName = null
    let cssFiles = []

    // inject react with cdn
    widgetCode = `import React from "https://cdn.skypack.dev/react@17?dts" \n${widgetCode}`

    widgetCode = await replaceImportsWithRemoteURL(widgetCode, resolveUrl(rootURL, manifest.main))

    // remove css imports and append to manifest (Only its used in the entry file)
    widgetCode = widgetCode.replace(/import\s+["'](.*)\.css["']/g, (match, p1) => {
        cssFiles.push(resolveUrl(rootURL, `${p1}.css`))

        return ""
    })

    // transform jsx to js
    widgetCode = await transform(widgetCode, {
        transforms: ["jsx"],
        //jsxRuntime: "automatic",
        //production: true,
    }).code

    // search export default and get the name of the function/const/class
    const exportDefaultRegex = /export\s+default\s+(?:function|const|class)\s+([a-zA-Z0-9]+)/g

    const exportDefaultMatch = exportDefaultRegex.exec(widgetCode)

    if (exportDefaultMatch) {
        renderComponentName = exportDefaultMatch[1]
    }

    // remove export default keywords
    widgetCode = widgetCode.replace("export default", "")

    let manifestProcessed = {
        ...manifest,
    }

    manifestProcessed.cssFiles = cssFiles
    manifestProcessed.main = resolveUrl(rootURL, manifest.main)
    manifestProcessed.icon = resolveUrl(rootURL, manifest.icon)

    let result = `
        ${widgetCode}

        export default {
            manifest: ${JSON.stringify(manifestProcessed)},
            renderComponent: ${renderComponentName},
        }
    `

    // minify code
    result = UglifyJS.minify(result, {
        compress: true,
        mangle: true,
    }).code

    return result
}

export default async (req, res) => {
    const widgetId = req.params.widgetId

    const useCache = req.query["use-cache"] ? toBoolean(req.query["use-cache"]) : true

    // try to find Widget
    const widget = await Widget.findOne({
        _id: widgetId,
    }).catch(() => {
        return null
    })

    if (!widget) {
        return res.status(404).json({
            error: "Widget not found.",
        })
    }

    if (!widget.manifest.main) {
        return res.status(404).json({
            error: "Widget entry file not defined",
        })
    }

    const requestedVersion = widgetId.split("@")[1] ?? widget.manifest.version

    let widgetCode = null

    // get origin from request url
    const origin = `${toBoolean(process.env.FORCE_CODE_SSL) ? "https" : req.protocol}://${req.get("host")}/static/widgets/${widgetId}@${requestedVersion}/`
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
            return res.status(500).json({
                error: `Unable to get widget code from storage. ${error.message}`,
                requestedFile: remoteEntyFilePath
            })
        }

        try {
            console.log(`🔌 [widget:${widgetId}] Compiling widget code...`)

            widgetCode = await compileWidgetCode(widgetCode, widget.manifest, origin)

            await global.redis.set(`${origin}:widget:${widgetId}@${requestedVersion}}`, widgetCode)
        } catch (error) {
            return res.status(500).json({
                message: "Unable to transform widget code.",
                error: error.message,
            })
        }

        if (!widgetCode) {
            return res.status(404).json({
                error: "Widget not found.",
            })
        }
    }

    res.setHeader("Content-Type", "application/javascript")
    return res.status(200).send(widgetCode)
}