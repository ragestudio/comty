import axios from "axios"
import Session from "comty.js/models/session"
import User from "comty.js/models/user"

async function injectUserData(list) {
    if (!Array.isArray(list)) {
        return list
    }

    const user_ids = list.map((item) => {
        return item.user_id
    })

    console.log(user_ids)

    const users = await User.data(user_ids.join(","))

    console.log(users)

    return list
}

export default class SpectrumAPI {
    static get url() {
        return "https://live.ragestudio.net"
    }

    static get base() {
        const instance = axios.create({
            baseURL: SpectrumAPI.url,
        })

        // const token = Session.token

        // if (token) {
        //     instance.defaults.headers.common["Authorization"] = `Bearer ${token}`
        // }

        return instance
    }

    static async getLivestreams({ limit, offset } = {}) {
        let { data } = await SpectrumAPI.base({
            method: "get",
            url: "/streaming/list",
            params: {
                limit,
                offset
            }
        })

        data = await injectUserData(data)

        return data
    }

    static async getLivestream(livestream_id) {
        const { data } = await SpectrumAPI.base({
            method: "get",
            url: `/streaming/${livestream_id}`
        })

        return data
    }
}