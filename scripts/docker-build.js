const path = require("path")
const fs = require("fs")
const exec = require("child_process").execSync

const sharedRootPath = path.resolve(process.cwd(), "shared")

const rootPath = process.cwd()
const packagesPath = path.resolve(rootPath, "packages")

const getPackages = require("./utils/getPackages")

async function main() {
    const packages = await getPackages()

    // copy shared dir to each root package path
    for await (const packageName of packages) {
        const packagePath = path.resolve(packagesPath, packageName)
        const sharedPath = path.resolve(packagePath, "src", "_shared")

        if (fs.existsSync(sharedPath)) {
            // remove old shared folder
            fs.rmdirSync(sharedPath, { recursive: true })
        }

        // copy entire shared folder
        // shared/* => /_shared/*
        fs.mkdirSync(sharedPath, { recursive: true })

        await exec(`cp -r ${sharedRootPath}/* ${sharedPath}`)
    }

    console.log("📦 Shared classes copied to each package.")

    // run docker build
    await exec("sudo docker compose build --no-cache")
}

main().catch(console.error)