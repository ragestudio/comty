const fs = require("fs")
const path = require("path")

const rootPath = process.cwd()
const packagesPath = path.resolve(rootPath, "packages")

async function readIgnoredPackages() {
    const packages = await fs.promises.readFile(path.resolve(rootPath, ".ignorepackages"), "utf-8").catch(() => "")

    return packages.split("\n")
}

async function filterPackages(packages, ignore = []) {
    const gitIgnore = fs.readFileSync(path.resolve(rootPath, ".gitignore"), "utf-8")

    // create a regex to match all packages that are in the gitignore file
    const gitIgnoreRegex = gitIgnore.split("\n").map((line) => {
        // remove comments
        if (line.startsWith("#")) return

        return line.replace(/(\/)/g, "\\/").replace(/(\*)/g, "(.*)")
    }).filter((line) => line)

    // filter packages that are in the gitignore file
    packages = packages.filter((packageName) => {
        // filter ignored packages
        if (ignore.includes(packageName)) {
            return false
        }

        const resolvedPath = path.resolve(packagesPath, packageName)

        return !gitIgnoreRegex.some((regex) => {
            return resolvedPath.match(regex)
        })
    })

    packages = packages.filter((packageName) => {
        return fs.statSync(path.resolve(packagesPath, packageName)).isDirectory()
    })

    return packages
}

async function getPackages({ ignore = [] } = {}) {
    let packages = await fs.promises.readdir(packagesPath)

    const ignoredPackages = await readIgnoredPackages()

    packages = filterPackages(packages, [
        ...ignore,
        ...ignoredPackages,
    ])

    return packages
}

module.exports = getPackages