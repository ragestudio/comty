require("dotenv").config()

const path = require("path")
const { registerBaseAliases } = require("linebridge/dist/server")
const { webcrypto: crypto } = require("crypto")
const infisical = require("infisical-node")

global.isProduction = process.env.NODE_ENV === "production"

globalThis["__root"] = path.resolve(process.cwd())
globalThis["__src"] = path.resolve(globalThis["__root"], global.isProduction ? "dist" : "src")

const customAliases = {
    "root": globalThis["__root"],
    "src": globalThis["__src"],
    "@shared-classes": path.resolve(globalThis["__src"], "_shared/classes"),
    "@services": path.resolve(globalThis["__src"], "services"),
}

if (!global.isProduction) {
    customAliases["comty.js"] = path.resolve(globalThis["__src"], "../../comty.js/src")
    customAliases["@shared-classes"] = path.resolve(globalThis["__src"], "shared-classes")
}

if (process.env.USE_LINKED_SHARED) {
    customAliases["@shared-classes"] = path.resolve(globalThis["__src"], "shared-classes")
}

registerBaseAliases(globalThis["__src"], customAliases)

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

async function injectEnvFromInfisical() {
    const envMode = global.isProduction ? "prod" : "dev"

    console.log(`🔑 Injecting env variables from INFISICAL in [${envMode}] mode...`)

    const client = new infisical({
        token: process.env.INFISICAL_TOKEN,
    })

    const secrets = await client.getAllSecrets({
        environment: global.isProduction ? "prod" : "dev",
        attachToProcessEnv: false,
    })

    // inject to process.env
    secrets.forEach((secret) => {
        if (!(process.env[secret.secretName])) {
            process.env[secret.secretName] = secret.secretValue
        }
    })
}

function handleExit(instance, code) {
    if (instance.server) {
        if (typeof instance.server.close === "function") {
            instance.server.close()
        }
    }

    return process.exit(code)
}

async function main({
    force_infisical,
} = {}) {
    const API = require(path.resolve(globalThis["__src"], "api.js")).default

    if (force_infisical || process.env.INFISICAL_TOKEN) {
        await injectEnvFromInfisical()
    }

    const instance = new API()

    process.on("exit", () => handleExit(instance, 0))
    process.on("SIGINT", () => handleExit(instance, 0))
    process.on("uncaughtException", () => handleExit(instance, 1))
    process.on("unhandledRejection", () => handleExit(instance, 1))

    await instance.initialize()

    return instance
}

main().catch((error) => {
    console.error(`🆘 [FATAL ERROR] >`, error)
})