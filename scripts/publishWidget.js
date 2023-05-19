import path from "path"
import fs from "fs"
import axios from "axios"
import sevenzip from "7zip-min"
import formdata from "form-data"

const tmpPath = path.join(process.cwd(), ".tmp")

const widgetsApi = "http://localhost:3040"
const token = process.argv[2]

const exluded = [
    "/.git",
    "/.tmp",
    "/bundle.7z",
    "/node_modules",
    "/package-lock.json",
]

async function copyToTmp(origin) {
    const files = fs.readdirSync(origin)

    for (const file of files) {
        const filePath = path.join(origin, file)

        // run a rexeg to check if the filePath is excluded
        const isExcluded = exluded.some((excludedPath) => {
            return filePath.match(excludedPath)
        })

        if (isExcluded) {
            continue
        }

        if (fs.lstatSync(filePath).isDirectory()) {
            await copyToTmp(filePath)
        } else {
            const fileContent = fs.readFileSync(filePath)
            const relativePath = filePath.replace(process.cwd(), "")
            const tmpFilePath = path.join(tmpPath, relativePath)

            fs.mkdirSync(path.dirname(tmpFilePath), { recursive: true })
            fs.writeFileSync(tmpFilePath, fileContent)
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

    const rootPath = process.cwd()

    // create a .tmp folder
    if (!fs.existsSync(tmpPath)) {
        fs.mkdirSync(tmpPath)
    }

    const bundlePath = path.join(rootPath, "bundle.7z")

    console.log("📦 Creating bundle...")

    await copyToTmp(rootPath)

    await createBundle(`${tmpPath}/*`, bundlePath)

    await fs.promises.rm(tmpPath, { recursive: true, force: true })

    console.log("📦✅ Bundle created successfully")

    console.log("🚚 Publishing bundle...")

    const formData = new formdata()

    formData.append("bundle", fs.createReadStream(bundlePath))

    const response = await axios({
        method: "POST",
        url: `${widgetsApi}/widgets/publish`,
        headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${token}`,
        },
        data: formData,
    }).catch((error) => {
        console.error("🛑 Error while publishing bundle \n\t", error.response?.data ?? error)

        return false
    })

    await fs.promises.rm(bundlePath, { recursive: true, force: true })
    await fs.promises.rm(tmpPath, { recursive: true, force: true })

    if (response) {
        console.log("🚚✅ Bundle published successfully! \n", response.data)
    }
}

main().catch(console.error)