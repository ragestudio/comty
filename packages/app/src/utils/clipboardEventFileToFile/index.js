export default async (eventFile) => {
    if (!eventFile) {
        throw new Error("Missing eventFile")
    }

    return await new Promise((resolve, reject) => {
        if (eventFile.type === "text/html") {
            eventFile.getAsString((data) => {
                const parser = new DOMParser()
                const doc = parser.parseFromString(data, "text/html")
                const img = doc.querySelector("img")

                // TODO: Support multiple mime types

                if (!img) {
                    return reject(new Error("No image found in clipboard. Only images are supported."))
                }

                const image = new Image()

                const finalExtension = "png" //img.src.split(".").pop()

                image.crossOrigin = "Anonymous"

                image.src = img.src

                image.onload = () => {
                    const canvas = document.createElement("canvas")

                    canvas.width = image.width
                    canvas.height = image.height

                    const context = canvas.getContext("2d")

                    context.drawImage(image, 0, 0, image.width, image.height)

                    canvas.toBlob((blob) => {
                        blob.lastModifiedDate = new Date()
                        blob.name = img.src.split("/").pop()

                        // remove the extension
                        blob.name = blob.name.split(".").slice(0, -1).join(".")

                        // set in the name the extension
                        blob.name = `${blob.name}.${finalExtension}`

                        blob.filename = blob.name

                        return resolve(new File([blob], blob.name, {
                            type: blob.type,
                            lastModified: blob.lastModifiedDate
                        }))
                    }, `image/${finalExtension}`)
                }
            })
        } else {
            return resolve(eventFile.getAsFile())
        }
    })
}