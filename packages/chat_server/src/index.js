require("dotenv").config()

if (typeof process.env.NODE_ENV === "undefined") {
    process.env.NODE_ENV = "development"
}

global.isProduction = process.env.NODE_ENV === "production"

import path from "path"
import { registerBaseAliases } from "linebridge/dist/server"

globalThis["__root"] = path.resolve(__dirname)

const customAliases = {
    "root": globalThis["__root"],
    "@shared-classes": path.resolve(__dirname, "_shared/classes"),
    "@services": path.resolve(__dirname, "services"),
}

if (!global.isProduction) {
    customAliases["comty.js"] = path.resolve(__dirname, "../../comty.js/src")
    customAliases["@shared-classes"] = path.resolve(__dirname, "shared-classes")
}

registerBaseAliases(undefined, customAliases)

// patches
const { Buffer } = require("buffer")

global.b64Decode = (data) => {
    return Buffer.from(data, "base64").toString("utf-8")
}
global.b64Encode = (data) => {
    return Buffer.from(data, "utf-8").toString("base64")
}

Array.prototype.updateFromObjectKeys = function (obj) {
    this.forEach((value, index) => {
        if (obj[value] !== undefined) {
            this[index] = obj[value]
        }
    })

    return this
}

global.toBoolean = (value) => {
    if (typeof value === "boolean") {
        return value
    }

    if (typeof value === "string") {
        return value.toLowerCase() === "true"
    }

    return false
}

import API from "./api"

async function main() {
    const api = new API()

    await api.initialize()
}

main().catch((error) => {
    console.error(`🆘 [FATAL ERROR] >`, error)
})