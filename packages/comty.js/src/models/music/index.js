import request from "../../handlers/request"
import pmap from "p-map"
import SyncModel from "../sync"

export default class MusicModel {
    static get api_instance() {
        return globalThis.__comty_shared_state.instances["music"]
    }

    static getFavorites = async ({
        useTidal = false
    }) => {
        let result = []

        const requesters = [
            async () => {
                let { data } = await request({
                    instance: MusicModel.api_instance,
                    method: "GET",
                    url: `/tracks/liked`,
                })

                return data
            },
        ]

        if (useTidal) {
            requesters.push(
                async () => {
                    const tidalResult = await SyncModel.tidalCore.getMyFavoriteTracks()

                    return tidalResult
                }
            )
        }

        result = await pmap(
            requesters,
            async (requester) => {
                const data = await requester()

                return data
            },
            {
                concurrency: 3
            }
        )

        result = result.reduce((acc, cur) => {
            return [...acc, ...cur]
        }, [])

        result = result.sort((a, b) => {
            return b.liked_at - a.liked_at
        })

        console.log(result)

        return result
    }

    static search = async (keywords, {
        limit = 5,
        offset = 0,
        useTidal = false,
    }) => {
        const { data } = await request({
            instance: MusicModel.api_instance,
            method: "GET",
            url: `/search`,
            params: {
                keywords,
                limit,
                offset,
                useTidal,
            }
        })

        return data
    }
}