const path = require("path")
const process = require('process')
const getPackages = require("./utils/getPackages")
const fs = require("fs")

const rootPackageJSON = require(path.resolve(process.cwd(), './package.json'))

const versionFile = path.resolve(process.cwd(), './.version')
let version = null
module.exports.version = version

let parsedVersion = {
    major: 0,
    minor: 0,
    patch: 0
}
module.exports.parsedVersion = parsedVersion

try {   //init from runtime
    if (!fs.existsSync(versionFile)) {
        console.log(`.version file not exist, creating...`)
        fs.writeFileSync(versionFile, rootPackageJSON.version)
    }
    version = fs.readFileSync(versionFile, 'utf8')

    const args = process.argv.slice(2);
    const parsed = version.split('.')

    parsedVersion.major = parsed[0] ? Number(parsed[0]) : 0
    parsedVersion.minor = parsed[1] ? Number(parsed[1]) : 0
    parsedVersion.patch = parsed[2] ? Number(parsed[2]) : 0

    if (args[0]) {
        switch (args[0]) {
            case "update": {
                console.log(`⚙ Updating version (${version}) to (${args[1]})`)
                return updateVersion(args[1])
            }
            case "bump": {
                return bumpVersion(args[1])
            }
            default: {
                console.error("Invalid arguments!")
                break;
            }
        }
    }
} catch (error) {
    console.error("Fatal error! >", error)
    return false
}

function parsedVersionToString(version) {
    return `${version.major}.${version.minor}.${version.patch}`
}
module.exports.parsedVersionToString = parsedVersionToString

function getVersion() {
    return version
}
module.exports.getVersion = getVersion

function updateVersion(to) {
    if (!to) {
        return false
    }
    let updated

    if (typeof (to) == "object") {
        updated = parsedVersionToString(to)
    } else {
        const parsed = to.split('.')
        parsedVersion.major = parsed[0] ? Number(parsed[0]) : 0
        parsedVersion.minor = parsed[1] ? Number(parsed[1]) : 0
        parsedVersion.patch = parsed[2] ? Number(parsed[2]) : 0

        updated = parsedVersionToString(parsedVersion)
    }

    console.log(`✅ Version updated to > ${updated}`)
    return fs.writeFileSync(versionFile, updated)
}
module.exports.updateVersion = updateVersion

function bumpVersion(params) {
    const bumps = {
        major: params.includes("major"),
        minor: params.includes("minor"),
        patch: params.includes("patch"),
    }

    if (bumps.major) {
        parsedVersion.major = parsedVersion.major + 1
        parsedVersion.minor = 0
        parsedVersion.path = 0
    }
    if (bumps.minor) {
        parsedVersion.minor = parsedVersion.minor + 1
        parsedVersion.path = 0
    }
    if (bumps.patch) {
        parsedVersion.patch = parsedVersion.patch + 1
    }

    function bumpTable(major, minor, patch) {
        this.major = major ? parsedVersion.major : false;
        this.minor = minor ? parsedVersion.minor : false;
        this.patch = patch ? parsedVersion.patch : false;
    }
    console.table(new bumpTable(bumps.major, bumps.minor, bumps.patch));

    return updateVersion(parsedVersion)
}
module.exports.bumpVersion = bumpVersion

function syncPackagesVersions() {
    const pkgs = getPackages()
    pkgs.forEach((pkg) => {
        try {
            const pkgFilePath = path.resolve(process.cwd(), `./packages/${pkg}/package.json`)
            if (!fs.existsSync(pkgFilePath)) {
                console.log(`[${pkg}] ❌ This package is not bootstraped! > package.json not found. > Run npm run bootstrap for init this package.`)
                return false
            }
            const pkgFile = JSON.parse(fs.readFileSync(pkgFilePath, 'utf8'))
            if (pkgFile.version !== version) {
                console.log(`[${pkg}] ✅ New version synchronized`)
                return fs.writeFileSync(pkgFilePath, version)
            }
            console.log(`[${pkg}] 💠 Version is synchronized, no changes have been made...`)
        } catch (error) {
            console.error(`[${pkg}] ❌ Error syncing ! > ${error}`)
        }
    })
}
module.exports.syncPackagesVersions = syncPackagesVersions