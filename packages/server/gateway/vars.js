import path from "node:path"

export default {
    servicesPath: path.resolve(process.cwd(), "services"),
    bootloaderBin: path.resolve(process.cwd(), "boot"),
}