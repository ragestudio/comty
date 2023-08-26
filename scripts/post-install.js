const fs = require("node:fs")
const path = require("node:path")

const sharedRootPath = path.resolve(process.cwd(), "shared")

const rootPath = process.cwd()
const packagesPath = path.resolve(rootPath, "packages")

const getPackages = require("./utils/getPackages")

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
            }

            fs.symlinkSync(originClassPath, finalLinkPath, "dir")

            console.log(`🔗 Linked resouce [${resource}] to [${finalLinkPath}]`)

            continue
        }
    }
}

async function main() {
    console.time("✅ post-install tooks:")

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