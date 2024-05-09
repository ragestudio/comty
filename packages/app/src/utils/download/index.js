import axios from "axios"
import mime from "mime"

export default async (uri) => {
    const key = `download-${uri}`
    console.log(`[UTIL] Downloading ${uri}`)

    try {
        app.cores.notifications.new({
            key: key,
            title: "Downloading",
            duration: 0,
            type: "loading",
            closable: false,
            feedback: false,
        })

        const metadata = await axios({
            method: "HEAD",
            url: uri,
        })

        const extension = mime.getExtension(metadata.headers["content-type"])
        const filename = `${metadata.headers["x-amz-meta-file-hash"]}.${extension}`

        const content = await axios({
            method: "GET",
            url: uri,
            responseType: "blob",
        })

        const file = new File([content.data], filename, {
            name: filename,
            type: metadata.headers["content-type"],
        })

        const url = URL.createObjectURL(file)

        const link = document.createElement("a")

        link.href = url
        link.download = file.name
        link.click()

        setTimeout(() => {
            app.cores.notifications.close(key)
        }, 1000)
    } catch (error) {
        console.error(error)

        app.cores.notifications.close(key)
    }
}