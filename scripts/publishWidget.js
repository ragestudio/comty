#!/usr/bin/env node
import path from "path"
import fs from "fs"
import axios from "axios"
import sevenzip from "7zip-min"
import formdata from "form-data"

const marketplaceAPIOrigin = "https://indev.comty.app/api/extensions"
const token = process.argv[2]

const excludedFiles = [
    "/.git",
    "/.tmp",
    "/bundle.7z",
    "/node_modules",
    "/package-lock.json",
]

const rootPath = process.cwd()
const tmpPath = path.join(rootPath, ".tmp")
const buildPath = path.join(tmpPath, "build")
const bundlePath = path.join(tmpPath, "bundle.7z")

async function copySources(origin, to) {
    const files = fs.readdirSync(origin)

    if (!fs.existsSync(to)) {
        await fs.promises.mkdir(to, { recursive: true })
    }

    for (const file of files) {
        const filePath = path.join(origin, file)

        // run a rexeg to check if the filePath is excluded
        const isExcluded = excludedFiles.some((excludedPath) => {
            return filePath.match(excludedPath)
        })

        if (isExcluded) {
            continue
        }

        if (fs.lstatSync(filePath).isDirectory()) {
            await copySources(filePath, path.join(to, file))
        } else {
            await fs.promises.copyFile(filePath, path.join(to, file))
        }
    }
}

async function createBundle(origin, desitinationFile) {
    return new Promise((resolve, reject) => {
        sevenzip.pack(origin, desitinationFile, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

async function main() {
    if (!token) {
        console.error("🛑 You need to pass a token as argument")
        return
    }

    // create a .tmp folder
    if (fs.existsSync(tmpPath)) {
        await fs.promises.rm(tmpPath, { recursive: true, force: true })
    }

    try {
        // try to read package.json
        if (!fs.existsSync(path.resolve(rootPath, "package.json"))) {
            console.error("🛑 package.json not found")
            return
        }

        const packageJSON = require(path.resolve(rootPath, "package.json"))

        // check if package.json has a main file
        if (!packageJSON.main) {
            console.error("🛑 package.json does not have a main file")
            return
        }

        if (!fs.existsSync(path.resolve(rootPath, packageJSON.main))) {
            console.error("🛑 main file not found")
            return
        }
        
        console.log(packageJSON)

        console.log("📦 Creating bundle...")

        await copySources(rootPath, buildPath)
        await createBundle(`${buildPath}/*`, bundlePath)

        console.log("📦✅ Bundle created successfully")

        console.log("🚚 Publishing bundle...")

        const formData = new formdata()

        formData.append("file", fs.createReadStream(bundlePath))

        const response = await axios({
            method: "PUT",
            url: `${marketplaceAPIOrigin}/publish`,
            headers: {
                ...formData.getHeaders(),
                pkg: JSON.stringify(packageJSON),
                Authorization: `Bearer ${token}`,
            },
            data: formData,
        }).catch((error) => {
            console.error("🛑 Error while publishing bundle \n\t", error.response?.data ?? error)

            return false
        })

        if (response) {
            console.log("🚚✅ Bundle published successfully! \n", response.data)
        }

        await fs.promises.rm(tmpPath, { recursive: true, force: true })
    } catch (error) {
        console.error("🛑 Error while publishing bundle \n\t", error)
        await fs.promises.rm(tmpPath, { recursive: true, force: true })
    }
}

main().catch(console.error)