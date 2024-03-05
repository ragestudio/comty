import request from "../../handlers/request"

export default class WidgetModel {
    static browse = async ({ limit, offset, keywords } = {}) => {
        const response = await request({
            instance: globalThis.__comty_shared_state.instances["marketplace"],
            method: "GET",
            url: "/widgets",
            params: {
                limit,
                offset,
                keywords: JSON.stringify(keywords),
            },
        })

        return response.data
    }
}