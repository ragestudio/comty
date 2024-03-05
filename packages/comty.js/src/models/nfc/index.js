import request from "../../handlers/request"

export default class NFCModel {
    static async getOwnTags() {
        const { data } = await request({
            method: "GET",
            url: `/nfc/tags`
        })

        return data
    }

    static async getTagById(id) {
        if (!id) {
            throw new Error("ID is required")
        }

        const { data } = await request({
            method: "GET",
            url: `/nfc/tags/${id}`
        })

        return data
    }

    static async getTagBySerial(serial) {
        if (!serial) {
            throw new Error("Serial is required")
        }

        const { data } = await request({
            method: "GET",
            url: `/nfc/tag/serial/${serial}`
        })

        return data
    }

    static async registerTag(serial, payload) {
        if (!serial) {
            throw new Error("Serial is required")
        }

        if (!payload) {
            throw new Error("Payload is required")
        }

        const { data } = await request({
            method: "POST",
            url: `/nfc/tag/${serial}`,
            data: payload
        })

        return data
    }
}