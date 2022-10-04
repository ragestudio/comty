require("dotenv").config()

const packagejson = require("../package.json")

import fs from "fs"
import path from "path"
import express from "express"
import cors from "cors"
import setupLatestRelease from "./lib/setupDist"

global.remoteRepo = "ragestudio/comty"
global.cachePath = path.join(process.cwd(), "cache")
global.distPath = path.join(process.cwd(), "dist")

async function checkDistIntegrity() {
    // check if dist folder exists
    if (!fs.existsSync(global.distPath)) {
        return false
    }

    // TODO: check the dist checksum with oficial server checksum

    return true
}

async function runServer() {
    const app = express()

    const portFromArgs = process.argv[2]
    let portListen = portFromArgs ? portFromArgs : 9000

    app.use(cors({
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: true,
        optionsSuccessStatus: 204
    }))

    app.use(express.static(global.distPath))

    app.get("*", function (req, res) {
        res.sendFile(path.join(global.distPath, "index.html"))
    })

    app.listen(portListen)

    console.log(`🌐  Listening app in port [${portListen}]`)
}

async function main() {
    // check if dist is valid
    if (!checkDistIntegrity()) {
        await setupLatestRelease()
    }

    // start app
    await runServer()
}

main().catch((err) => {
    console.error(`[FATAL ERROR] >`, err)
})