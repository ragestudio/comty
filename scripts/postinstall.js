const fs = require("node:fs")
const path = require("node:path")

const sharedRootPath = path.resolve(process.cwd(), "shared")
const sharedClassesPath = path.resolve(sharedRootPath, "classes")

const rootPath = process.cwd()
const packagesPath = path.resolve(rootPath, "packages")

const getPackages = require("./utils/getPackages")

async function linkSharedClasses(pkgJSON, packagePath) {
    if (typeof pkgJSON !== "object") {
        throw new Error("Package must be an object")
    }

    const { sharedClasses } = pkgJSON

    if (!sharedClasses) {
        return
    }

    for (const [className, linkPath] of Object.entries(sharedClasses)) {
        const originClassPath = path.resolve(sharedClassesPath, className)
        const finalLinkPath = path.resolve(packagePath, linkPath, className)

        if (!fs.existsSync(originClassPath)) {
            throw new Error(`Class [${className}] does not exist`)
        }
        if (fs.existsSync(finalLinkPath)) {
            console.warn(`⚠️  Class [${className}] already exists in [${finalLinkPath}]`)
            continue
        } else {
            fs.mkdirSync(path.resolve(packagePath, linkPath), { recursive: true })
        }

        // link folder recursively
        fs.symlinkSync(originClassPath, finalLinkPath, "dir")

        console.log(`🔗 Linked [${className}] to [${finalLinkPath}]`)
    }
}

async function main() {
    console.time("Postinstall tooks:")

    // read dir with absolute paths
    let packages = await getPackages()

    for (const packageName of packages) {
        const packagePath = path.resolve(packagesPath, packageName)

        const packageJsonPath = path.resolve(packagePath, "package.json")

        if (!fs.existsSync(packageJsonPath)) {
            continue
        }

        const packageJson = require(packageJsonPath)

        if (packageJson.sharedClasses) {
            console.log(`📦 Package [${packageName}] has shared classes.`)

            await linkSharedClasses(packageJson, packagePath)
        }
    }

    console.timeEnd("Postinstall tooks:")
}

main().catch(console.error)