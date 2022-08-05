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

import API from "./api"

async function main() {
    const mainAPI = new API()

    console.log("\n▶️ Initializing main API...\n")
    await mainAPI.initialize()
}

main().catch((error) => {
    console.error(`🆘 [FATAL ERROR] >`, error)
})