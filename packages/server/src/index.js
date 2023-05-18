require("dotenv").config()
global.isProduction = process.env.NODE_ENV === "production"

import { webcrypto as crypto } from "crypto"
import path from "path"
import { registerBaseAliases } from "linebridge/dist/server"

const customAliases = {
    "@services": path.resolve(__dirname, "services"),
}

if (!global.isProduction) {
    customAliases["comty.js"] = path.resolve(__dirname, "../../comty.js/src")
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

global.nanoid = (t = 21) => crypto.getRandomValues(new Uint8Array(t)).reduce(((t, e) => t += (e &= 63) < 36 ? e.toString(36) : e < 62 ? (e - 26).toString(36).toUpperCase() : e > 62 ? "-" : "_"), "");

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
    const mainAPI = new API()

    await mainAPI.initialize()
}

main().catch((error) => {
    console.error(`🆘 [FATAL ERROR] >`, error)
})