const path = require("path")
const fs = require("fs")

const validTypes = ["patch", "minor", "major"]

async function bumpVersion({
    type,
    count = 1,
    noWrite = false,
    root = path.resolve(__dirname, "..", "..")
}) {
    if (!validTypes.includes(type)) {
        console.error("Invalid version type")
        return false
    }

    const rootPkgjson = require(path.resolve(root, "package.json"))

    if (!rootPkgjson || !rootPkgjson.version) {
        console.error("Invalid root package.json")
        return false
    }

    let newVersion = rootPkgjson.version

    newVersion = rootPkgjson.version.split(".")

    switch (type) {
        case "patch":
            newVersion[2] = parseInt(newVersion[2]) + Number(count ?? 1)
            break
        case "minor":
            newVersion[1] = parseInt(newVersion[1]) + Number(count ?? 1)
            newVersion[2] = 0
            break
        case "major":
            newVersion[0] = parseInt(newVersion[0]) + Number(count ?? 1)
            newVersion[1] = 0
            newVersion[2] = 0
            break
        default:
            console.error("Invalid version type")
            return false
    }

    newVersion = newVersion.join(".")

    const ignore = fs.readFileSync(path.resolve(process.cwd(), ".gitignore"), "utf8").split("\n").filter(line => line !== "").filter(line => !line.startsWith("#"))

    const ignoreRegex = ignore.map((line) => {
        let regex = line.replace(/\./g, "\\.").replace(/\*/g, ".*")

        if (!regex.startsWith("/")) {
            regex = `/${regex}`
        }

        if (!regex.endsWith("/")) {
            regex = `${regex}/`
        }

        return regex
    })

    const packagesPath = path.resolve(root, "packages")

    let packages = fs.readdirSync(packagesPath)

    packages = packages.filter((package) => {
        let isIgnored = false

        ignoreRegex.forEach(regex => {
            if (new RegExp(regex).test(`/${package}/`)) {
                isIgnored = true
            }
        })

        return !isIgnored
    })

    // filter out ignored packages
    packages = packages.filter((package) => !ignore.includes(package))

    // filter out non-directories
    packages = packages.filter((package) => fs.lstatSync(path.resolve(packagesPath, package)).isDirectory())

    // filter out non-package.json
    packages = packages.filter((package) => fs.existsSync(path.resolve(packagesPath, package, "package.json")))

    for await (let package of packages) {
        const pkgjson = require(path.resolve(packagesPath, package, "package.json"))

        if (!pkgjson || !pkgjson.version) {
            continue
        }

        console.log(`⏩ Bumped [${pkgjson.name}] ${pkgjson.version} to ${newVersion}`)

        pkgjson.version = newVersion

        if (noWrite) {
            continue
        }

        return await fs.writeFileSync(path.resolve(packagesPath, package, "package.json"), JSON.stringify(pkgjson, null, 4))
    }

    // write root package.json
    if (!noWrite) {
        rootPkgjson.version = newVersion

        await fs.writeFileSync(path.resolve(root, "package.json"), JSON.stringify(rootPkgjson, null, 4))
    }

    return newVersion
}

module.exports = bumpVersion