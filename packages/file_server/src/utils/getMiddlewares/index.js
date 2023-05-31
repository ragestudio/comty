import fs from "node:fs"
import path from "node:path"

export default async (middlewares, middlewaresPath) => {
    if (typeof middlewaresPath === "undefined") {
        middlewaresPath = path.resolve(globalThis["__root"], "middlewares")
    }

    if (!fs.existsSync(middlewaresPath)) {
        return undefined
    }

    if (typeof middlewares === "string") {
        middlewares = [middlewares]
    }

    let fns = []

    for await (const middlewareName of middlewares) {
        const middlewarePath = path.resolve(middlewaresPath, middlewareName)

        if (!fs.existsSync(middlewarePath)) {
            console.error(`Middleware ${middlewareName} not found.`)

            continue
        }

        const middleware = require(middlewarePath).default

        if (!middleware) {
            console.error(`Middleware ${middlewareName} not valid export.`)

            continue
        }

        if (typeof middleware !== "function") {
            console.error(`Middleware ${middlewareName} not valid function.`)

            continue
        }

        fns.push(middleware)
    }

    return fns
}