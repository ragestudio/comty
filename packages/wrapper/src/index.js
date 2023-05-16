require("dotenv").config()

const packagejson = require("../package.json")

const fs = require("fs")
const path = require("path")
const express = require("express")
const cors = require("cors")

const { setupLatestRelease } = require("./lib/setupDist")

global.remoteRepo = "ragestudio/comty"
global.cachePath = path.join(process.cwd(), "cache")
global.distPath = path.join(process.cwd(), "dist")

function checkDistIntegrity() {
    // check if dist folder exists
    if (!fs.existsSync(global.distPath)) {
        return false
    }

    // TODO: check the dist checksum with oficial server checksum

    return true
}

function fetchDistManifest() {
    if (!fs.existsSync(global.distPath)) {
        return null
    }

    const pkgPath = path.join(global.distPath, "manifest.json")

    if (!fs.existsSync(pkgPath)) {
        return null
    }

    const pkg = require(pkgPath)

    return pkg
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

    app.get("/_dist_manifest", async (req, res) => {
        const manifest = fetchDistManifest()

        if (!manifest) {
            return res.status(500).send("Dist not found")
        }

        return res.json(manifest)
    })

    app.get("*", function (req, res) {
        res.sendFile(path.join(global.distPath, "index.html"))
    })

    app.listen(portListen)

    console.log(`Running Wrapper v${packagejson.version}`)
    console.log(`🌐  Listening app in port [${portListen}]`)
}

async function main() {
    // check if dist is valid
    if (!checkDistIntegrity()) {
        console.log("DistIntegrity is not valid, downloading latest release...")
        await setupLatestRelease()
    }

    // start app
    await runServer()
}

main().catch((err) => {
    console.error(`[FATAL ERROR] >`, err)
})