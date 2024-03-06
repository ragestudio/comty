#!/usr/bin/env node
require("dotenv").config()
require("sucrase/register")

const path = require("path")
const Module = require("module")
const { Buffer } = require("buffer")
const { webcrypto: crypto } = require("crypto")
const { InfisicalClient } = require("@infisical/sdk")

const moduleAlias = require("module-alias")

// Override file execution arg
process.argv.splice(1, 1)
process.argv[1] = path.resolve(process.argv[1])

// Expose boot function to global
global.Boot = Boot
global.isProduction = process.env.NODE_ENV === "production"

global["__root"] = path.resolve(process.cwd())
global["__src"] = path.resolve(globalThis["__root"], path.dirname(process.argv[1]))

global["aliases"] = {
    "root": global["__root"],
    "src": global["__src"],

    // expose shared resources
    "@db_models": path.resolve(__dirname, "db_models"),
    "@shared-utils": path.resolve(__dirname, "utils"),
    "@shared-classes": path.resolve(__dirname, "classes"),
    "@shared-lib": path.resolve(__dirname, "lib"),
    "@shared-middlewares": path.resolve(__dirname, "middlewares"),

    // expose internal resources
    "@lib": path.resolve(global["__src"], "lib"),
    "@middlewares": path.resolve(global["__src"], "middlewares"),
    "@controllers": path.resolve(global["__src"], "controllers"),
    "@config": path.resolve(global["__src"], "config"),
    "@shared": path.resolve(global["__src"], "shared"),
    "@classes": path.resolve(global["__src"], "classes"),
    "@models": path.resolve(global["__src"], "models"),
    "@services": path.resolve(global["__src"], "services"),
    "@utils": path.resolve(global["__src"], "utils"),
}

function registerBaseAliases(fromPath, customAliases = {}) {
    if (typeof fromPath === "undefined") {
        if (module.parent.filename.includes("dist")) {
            fromPath = path.resolve(process.cwd(), "dist")
        } else {
            fromPath = path.resolve(process.cwd(), "src")
        }
    }

    moduleAlias.addAliases({
        ...customAliases,
        "@controllers": path.resolve(fromPath, "controllers"),
        "@middlewares": path.resolve(fromPath, "middlewares"),
        "@models": path.resolve(fromPath, "models"),
        "@classes": path.resolve(fromPath, "classes"),
        "@lib": path.resolve(fromPath, "lib"),
        "@utils": path.resolve(fromPath, "utils"),
    })
}

function registerPatches() {
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

    global.ToBoolean = (value) => {
        if (typeof value === "boolean") {
            return value
        }

        if (typeof value === "string") {
            return value.toLowerCase() === "true"
        }

        return false
    }
}

function registerAliases() {
    registerBaseAliases(global["__src"], global["aliases"])
}

async function injectEnvFromInfisical() {
    const envMode = global.FORCE_ENV ?? global.isProduction ? "prod" : "dev"

    console.log(`[BOOT] 🔑 Injecting env variables from INFISICAL in [${envMode}] mode...`)

    const client = new InfisicalClient({
        accessToken: process.env.INFISICAL_TOKEN,
    })

    const secrets = await client.listSecrets({
        environment: envMode,
        path: process.env.INFISICAL_PATH ?? "/",
        projectId: process.env.INFISICAL_PROJECT_ID ?? null,
        includeImports: false,
    })

    //inject to process.env
    secrets.forEach((secret) => {
        if (!(process.env[secret.secretKey])) {
            process.env[secret.secretKey] = secret.secretValue
        }
    })
}

async function Boot(main) {
    if (!main) {
        throw new Error("main class is not defined")
    }

    if (process.env.INFISICAL_TOKEN) {
        console.log(`[BOOT] INFISICAL_TOKEN found, injecting env variables from INFISICAL...`)
        await injectEnvFromInfisical()
    }

    const instance = new main()

    await instance.initialize()

    if (process.env.lb_service && process.send) {
        process.send({
            status: "ready"
        })
    }

    return instance
}

console.log(`[BOOT] Booting in [${global.isProduction ? "production" : "development"}] mode...`)

// Apply patches
registerPatches()

// Apply aliases
registerAliases()

// execute main
Module.runMain()