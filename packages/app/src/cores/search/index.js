import Core from "evite/src/core"

export default class Search extends Core {
    static namespace = "searchEngine"
    static dependencies = ["api"]
    static public = ["search"]

    apiBridge = null

    search = async (keywords, params = {}) => {
        if (!this.apiBridge) {
            this.apiBridge = app.api.withEndpoints("main")
        }

        return await this.apiBridge.get.search(undefined, { keywords: keywords, params })
    }
}