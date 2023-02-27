export default class UploadModel {
    static async uploadFile(file) {
        // get the file from the payload
        if (!file) {
            throw new Error("File is required")
        }

        // create a new form data
        const formData = new FormData()

        // append the file to the form data
        formData.append("files", file)

        // send the request
        const uploadRequest = await app.cores.api.customRequest( {
            method: "POST",
            url: "/upload",
            data: formData,
        }).catch((err) => {
            throw new Error(err.response.data.message)
        })

        if (uploadRequest.data.files.length === 0) {
            throw new Error("Upload failed, empty response")
        }

        return uploadRequest.data.files[0]
    }

    static async uploadFiles(files) {
        // get the file from the payload
        if (!files) {
            throw new Error("Files are required")
        }

        if (!Array.isArray(files)) {
            throw new Error("Files must be an array")
        }

        const resultFiles = []

        for await (const file of files) {
            const result = await UploadModel.uploadFile(file)
            resultFiles.push(result)
        }

        return resultFiles
    }
}