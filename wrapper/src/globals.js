require("dotenv").config()

const path = require("path")
const moduleAlias = require("module-alias")

global.packagejson = require("../package.json")
global.__root = path.resolve(__dirname)
global.isProduction = process.env.NODE_ENV === "production"
global.remoteRepo = "ragestudio/comty"
global.cachePath = path.join(process.cwd(), "cache")
global.distPath = path.join(process.cwd(), "dist")

const aliases = {
    "@shared-classes": path.resolve(__dirname, "_shared/classes"),
    "@shared-lib": path.resolve(__dirname, "_shared/lib"),
}

if (!global.isProduction) {
    aliases["@shared-classes"] = path.resolve(__dirname, "shared-classes")
}

moduleAlias.addAliases(aliases)