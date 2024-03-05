import request from "../../handlers/request"

export default class Search {
    static search = async (keywords, params = {}) => {
        const { data } = await request({
            method: "GET",
            url: `/search`,
            params: {
                keywords: keywords,
                params: params
            }
        })

        return data
    }

    static async quickSearch(params) {
        const response = await request({
            method: "GET",
            url: "/search/quick",
            params: params
        })

        return response.data
    }
}