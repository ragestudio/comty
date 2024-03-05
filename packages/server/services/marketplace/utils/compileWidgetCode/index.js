import { transform } from "sucrase"
import UglifyJS from "uglify-js"

import resolveUrl from "@utils/resolveUrl"
import replaceImportsWithRemoteURL from "@utils/replaceImportsWithRemoteURL"

export default async (widgetCode, manifest, rootURL) => {
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