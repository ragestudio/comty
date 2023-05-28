import fs from "fs"

function createRoutesFromDirectory(startFrom, directoryPath, router) {
    const files = fs.readdirSync(directoryPath)

    if (typeof router.routes !== "object") {
        router.routes = []
    }

    files.forEach((file) => {
        const filePath = `${directoryPath}/${file}`

        const stat = fs.statSync(filePath)

        if (stat.isDirectory()) {
            createRoutesFromDirectory(startFrom, filePath, router)
        } else if (file.endsWith(".js") || file.endsWith(".jsx") || file.endsWith(".ts") || file.endsWith(".tsx")) {
            let splitedFilePath = filePath.split("/")

            // slice the startFrom path
            splitedFilePath = splitedFilePath.slice(splitedFilePath.indexOf(startFrom) + 1)

            const method = splitedFilePath[0]

            let route = splitedFilePath.slice(1, splitedFilePath.length).join("/")

            route = route.replace(".jsx", "")
            route = route.replace(".js", "")
            route = route.replace(".ts", "")
            route = route.replace(".tsx", "")

            if (route === "index") {
                route = "/"
            } else {
                route = `/${route}`
            }

            let handler = require(filePath)

            handler = handler.default || handler

            router[method](route, handler)

            router.routes.push({
                method,
                path: route,
            })
        }
    })

    return router
}

export default createRoutesFromDirectory