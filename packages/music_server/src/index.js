
import { webcrypto as crypto } from "crypto"
import path from "path"
import { registerBaseAliases } from "linebridge/dist/server"
import infisical from "infisical-node"

require("dotenv").config()

global.isProduction = process.env.NODE_ENV === "production"

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
    if (process.env.INFISICAL_TOKEN) {
        const client = new infisical({
            token: process.env.INFISICAL_TOKEN,
        })

        const secrets = await client.getAllSecrets()

        // inject to process.env
        secrets.forEach((secret) => {
            process.env[secret.secretName] = secret.secretValue
        })
    }

    const instance = new API()

    await instance.initialize()

    // kill on process exit
    process.on("exit", () => {
        if (typeof instance.server.close === "function") {
            instance.server.close()
        }
        process.exit(0)
    })

    // kill on ctrl+c
    process.on("SIGINT", () => {
        if (typeof instance.server.close === "function") {
            instance.server.close()
        }
        process.exit(0)
    })

    // kill on uncaught exceptions
    process.on("uncaughtException", (error) => {
        console.error(`🆘 [FATAL ERROR] >`, error)

        if (typeof instance.server.close === "function") {
            instance.server.close()
        }

        process.exit(1)
    })

    // kill on unhandled rejections
    process.on("unhandledRejection", (error) => {
        console.error(`🆘 [FATAL ERROR] >`, error)

        if (typeof instance.server.close === "function") {
            instance.server.close()
        }

        process.exit(1)
    })
}

main().catch((error) => {
    console.error(`🆘 [FATAL ERROR] >`, error)
})