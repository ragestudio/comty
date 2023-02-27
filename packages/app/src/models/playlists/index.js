export default class PlaylistsModel {
    static get bridge() {
        return window.app?.cores.api.withEndpoints()
    }

    static async uploadTrack(file, payload) {
        if (!PlaylistsModel.bridge) {
            throw new Error("Bridge is not available")
        }

        // get the file from the payload
        if (!file) {
            throw new Error("File is required")
        }

        console.log(file)

        // create a new form data
        const formData = new FormData()

        // append the file to the form data
        formData.append("files", file)

        // send the request
        const uploadRequest = await app.cores.api.customRequest( {
            method: "POST",
            url: "/upload",
            data: formData,
        })

        console.log(uploadRequest.data)

        if (!uploadRequest.data.files[0]) {
            throw new Error("Upload failed")
        }

        // get the url
        const source = uploadRequest.data.files[0].url

        // send the request for the track to be created
        const trackRequest = await app.cores.api.customRequest( {
            method: "POST",
            url: "/tracks/publish",
            data: {
                ...payload,
                source,
            }
        })

        return trackRequest.data
    }

    static async publishTrack(payload) {
        const { data } = await app.cores.api.customRequest( {
            method: "POST",
            url: "/tracks/publish",
            data: payload,
        })

        return data
    }

    static async publish(payload) {
        const { data } = await app.cores.api.customRequest( {
            method: "POST",
            url: `/playlist/publish`,
            data: payload,
        })

        return data
    }

    static async getPlaylist(id) {
        const { data } = await app.cores.api.customRequest( {
            method: "GET",
            url: `/playlist/data/${id}`,
        })

        return data
    }

    static async getMyReleases() {
        const { data } = await app.cores.api.customRequest( {
            method: "GET",
            url: `/playlist/self`,
        })

        return data
    }

    static async updateTrack(payload) {
        if (!payload) {
            throw new Error("Payload is required")
        }

        const { data } = await app.cores.api.customRequest( {
            method: "PUT",
            url: `/tracks/${payload._id}`,
            data: {
                payload
            },
        })

        return data
    }

    static async updatePlaylist(payload) {
        if (!payload) {
            throw new Error("Payload is required")
        }

        const { data } = await app.cores.api.customRequest( {
            method: "PUT",
            url: `/playlist/${payload._id}`,
            data: {
                payload
            },
        })

        return data
    }

    static async deletePlaylist(id) {
        if (!id) {
            throw new Error("ID is required")
        }

        const { data } = await app.cores.api.customRequest( {
            method: "DELETE",
            url: `/playlist/${id}`,
        })

        return data
    }
}