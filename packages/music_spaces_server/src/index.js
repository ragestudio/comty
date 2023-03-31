require("dotenv").config()

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

import pkg from "../package.json"
import API from "./api"

async function main() {
    const api = new API()

    console.log(`\n▶️ Initializing ${pkg.name} ...\n`)
    const init = await api.initialize()

    console.log(`\n🚀 ${pkg.name} v${pkg.version} is running on port ${init.listenPort}.\n`)
}

main().catch((error) => {
    console.error(`🆘 [FATAL ERROR] >`, error)
})