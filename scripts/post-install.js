const fs = require("node:fs")
const path = require("node:path")
const child_process = require("node:child_process")

const rootPath = process.cwd()

const sharedRootPath = path.resolve(rootPath, "shared")
const packagesPath = path.resolve(rootPath, "packages")

const getPackages = require("./utils/getPackages")

const pkgjson = require("../package.json")

// vars
const appPath = path.resolve(rootPath, pkgjson._web_app_path)
const comtyjsPath = path.resolve(rootPath, "comty.js")
const vesselPath = path.resolve(rootPath, "vessel")
const linebridePath = path.resolve(rootPath, "linebridge")

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

            try {
                fs.symlinkSync(originClassPath, finalLinkPath, "dir")
                console.log(`🔗 Linked resouce [${resource}] to [${finalLinkPath}]`)
            } catch (error) {
                if (error.code && error.code == 'EEXIST') {
                    fs.unlinkSync(finalLinkPath)
                    fs.symlinkSync(originClassPath, finalLinkPath, "dir")
                    console.log(`🔗 Linked resouce [${resource}] to [${finalLinkPath}]`)
                }
            }

            continue
        }
    }
}

async function linkInternalSubmodules(packages) {
    //* APP RUNTIME LINKING
    console.log(`Linking Vessel to app...`)

    await child_process.execSync("yarn link", {
        cwd: vesselPath,
        stdio: "inherit",
    })

    await child_process.execSync(`yarn link "vessel"`, {
        cwd: appPath,
        stdio: "inherit",
    })

    //* COMTY.JS LINKING
    console.log(`Linking comty.js to app...`)

    await child_process.execSync(`yarn link`, {
        cwd: comtyjsPath,
        stdio: "inherit",
    })

    await child_process.execSync(`yarn link "comty.js"`, {
        cwd: appPath,
        stdio: "inherit",
    })

    //* LINEBRIDE LINKING
    console.log(`Linking Linebride to servers...`)

    await child_process.execSync(`yarn link`, {
        cwd: linebridePath,
        stdio: "inherit",
    })

    for await (const packageName of packages) {
        const packagePath = path.resolve(packagesPath, packageName)

        const packageJsonPath = path.resolve(packagePath, "package.json")

        if (!fs.existsSync(packageJsonPath)) {
            continue
        }

        await child_process.execSync(`yarn link "linebridge"`, {
            cwd: packagePath,
            stdio: "inherit",
        })

        console.log(`Linking Linebride to package [${packageName}]...`)
    }

    console.log(`✅ All submodules linked!`)

    return true
}

async function main() {
    console.time("✅ post-install tooks:")

    // read dir with absolute paths
    let packages = await getPackages()

    // link shared resources
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

    // install dependencies for modules
    console.log("Installing app dependencies...")
    await child_process.execSync("npm install --force", {
        cwd: appPath,
        stdio: "inherit",
    })

    console.log("Installing vessel dependencies...")
    await child_process.execSync("npm install --force", {
        cwd: vesselPath,
        stdio: "inherit",
    })
   
    console.log("Installing comty.js dependencies...")
    await child_process.execSync("npm install --force", {
        cwd: comtyjsPath,
        stdio: "inherit",
    })

    console.log("Installing linebridge dependencies...")
    await child_process.execSync("npm install --force", {
        cwd: linebridePath,
        stdio: "inherit",
    })

    // link internal submodules
    await linkInternalSubmodules(packages)

    // fixes for arm architecture
    if (process.arch == "arm64") {
        // rebuild tfjs
        console.log("Rebuilding TFJS...")

        await child_process.execSync("npm rebuild @tensorflow/tfjs-node --build-from-source", {
            cwd: rootPath,
            stdio: "inherit",
        })
    }

    console.timeEnd("✅ post-install tooks:")
}

main().catch(console.error)
