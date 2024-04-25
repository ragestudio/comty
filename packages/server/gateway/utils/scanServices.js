import fs from "node:fs"
import path from "node:path"

import Vars from "../vars"

export default async () => {
    const finalServices = []

    console.log(Vars)

    let services = fs.readdirSync(Vars.servicesPath)

    for await (let _path of services) {
        _path = path.resolve(Vars.servicesPath, _path)

        if (fs.lstatSync(_path).isDirectory()) {
            // search main file "*.service.*" (using regex) on the root of the service path
            const mainFile = fs.readdirSync(_path).find((filename) => {
                const regex = new RegExp(`^.*\.service\..*$`)

                return regex.test(filename)
            })

            if (mainFile) {
                finalServices.push(path.resolve(_path, mainFile))
            }
        }
    }

    return finalServices
}
