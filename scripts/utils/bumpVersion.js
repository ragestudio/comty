const path = require("path")
const fs = require("fs")

const validTypes = ["patch", "minor", "major"]

async function bumpVersion(type, count, noWrite = false) {
    if (!validTypes.includes(type)) {
        console.error("Invalid version type")
        return false
    }

    // read all directories from `./packages` and __dirname/..
    // find `package.json` files
    // and bump depending on the `type` argument (patch, minor, major)
    // write into `package.json` files
    // exclude gitignored

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

    const packagesPath = path.resolve(__dirname, "..", "..", "packages")

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

    for (let package of packages) {
        const pkgjson = require(path.resolve(packagesPath, package, "package.json"))

        if (!pkgjson || !pkgjson.version) {
            continue
        }

        let version = pkgjson.version.split(".")

        switch (type) {
            case "patch":
                version[2] = parseInt(version[2]) + Number(count ?? 1)
                break
            case "minor":
                version[1] = parseInt(version[1]) + Number(count ?? 1)
                break
            case "major":
                version[0] = parseInt(version[0]) + Number(count ?? 1)
                break
            default:
                console.error("Invalid version type")
                return false
        }

        version = version.join(".")

        console.log(`⏩ Bumped [${pkgjson.name}] ${pkgjson.version} to ${version}`)

        pkgjson.version = version

        if (noWrite) {
            continue
        }

        fs.writeFileSync(path.resolve(packagesPath, package, "package.json"), JSON.stringify(pkgjson, null, 4))
    }

    return true
}

module.exports = bumpVersion