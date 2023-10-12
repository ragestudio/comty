const fs = require("node:fs")
const path = require("node:path")
const child_process = require("node:child_process")

const rootPath = process.cwd()

const sharedRootPath = path.resolve(rootPath, "shared")
const packagesPath = path.resolve(rootPath, "packages")

const getPackages = require("./utils/getPackages")

const pkgjson = require("../package.json")

async function linkSharedResources(pkgJSON, packagePath) {
    if (typeof pkgJSON !== "object") {
        throw new Error("Package must be an object")
    }

    const { shared } = pkgJSON

    if (!shared) {
        return
    }

    if (typeof shared === "string") {
        const finalLinkPath = path.resolve(packagePath, shared)
        if (fs.existsSync(finalLinkPath)) {
            console.warn(`⚠️  Resource [${shared}] link already exists in [${finalLinkPath}]`)
            return
        }

        // link entire folder
        fs.symlinkSync(sharedRootPath, finalLinkPath, "dir")
    } else {
        for (const [resource, linkPath] of Object.entries(shared)) {
            const originClassPath = path.resolve(sharedRootPath, resource)
            const finalLinkPath = path.resolve(packagePath, linkPath)

            if (!fs.existsSync(originClassPath)) {
                throw new Error(`Resource [${resource}] does not exist`)
            }

            if (fs.existsSync(finalLinkPath)) {
                console.warn(`⚠️  Resource [${resource}] link already exists in [${finalLinkPath}]`)
                continue
            } else {
                fs.mkdirSync(path.resolve(finalLinkPath, ".."), { recursive: true })
            }

            fs.symlinkSync(originClassPath, finalLinkPath, "dir")

            console.log(`🔗 Linked resouce [${resource}] to [${finalLinkPath}]`)

            continue
        }
    }
}

async function initializeEvite() {
    const appPath = path.resolve(rootPath, pkgjson._web_app_path)
    const evitePath = path.resolve(rootPath, "evite")

    console.log("📦 Initializing Evite...")

    console.log(`Intalling Evite dependencies...`)
    await child_process.execSync("yarn install", {
        cwd: evitePath,
        stdio: "inherit",
    })

    console.log(`Linking Evite to app...`)
    await child_process.execSync("yarn link", {
        cwd: evitePath,
        stdio: "inherit",
    })

    await child_process.execSync(`yarn link "evite"`, {
        cwd: appPath,
        stdio: "inherit",
    })

    console.log(`✅ Evite dependencies installed`)

    return true
}

async function main() {
    console.time("✅ post-install tooks:")

    await initializeEvite()

    console.log("Rebuilding TFJS...")

    await child_process.execSync("npm rebuild @tensorflow/tfjs-node --build-from-source &&", {
        cwd: rootPath,
        stdio: "inherit",
    })

    // read dir with absolute paths
    let packages = await getPackages()

    for (const packageName of packages) {
        const packagePath = path.resolve(packagesPath, packageName)

        const packageJsonPath = path.resolve(packagePath, "package.json")

        if (!fs.existsSync(packageJsonPath)) {
            continue
        }

        const packageJson = require(packageJsonPath)

        if (packageJson.shared) {
            console.log(`📦 Package [${packageName}] has declared shared resources.`)

            await linkSharedResources(packageJson, packagePath)
        }
    }

    console.timeEnd("✅ post-install tooks:")
}

main().catch(console.error)