const path = require("path")
const fs = require("fs")
const child_process = require("child_process")

const sharedRootPath = path.resolve(process.cwd(), "shared")

const rootPath = process.cwd()
const packagesPath = path.resolve(rootPath, "packages")

const getPackages = require("./utils/getPackages")

async function main() {
    const packages = await getPackages({
        ignore: ["shared", "app", "wrapper"]
    })

    for await (const packageName of packages) {
        const packagePath = path.resolve(packagesPath, packageName)

        // copy shared
        const sharedPath = path.resolve(packagePath, "src", "_shared")

        if (fs.existsSync(sharedPath)) {
            // remove old shared folder
            fs.rmdirSync(sharedPath, { recursive: true })
        }

        // copy entire shared folder
        // shared/* => /_shared/*
        fs.mkdirSync(sharedPath, { recursive: true })

        await child_process.execSync(`cp -r ${sharedRootPath}/* ${sharedPath} && echo Shared lib copied`, {
            cwd: packagePath,
            stdio: "inherit"
        })

        // run yarn build
        await child_process.execSync("yarn build", {
            cwd: packagePath,
            stdio: "inherit"
        })
    }
}

main().catch(console.error)