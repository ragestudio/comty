import request from "../../handlers/request"
import pmap from "p-map"
import SyncModel from "../sync"

export default class MusicModel {
    static get api_instance() {
        return globalThis.__comty_shared_state.instances["music"]
    }

    // TODO: Move external services fetching to API
    static getFavorites = async ({
        useTidal = false,
        limit,
        offset,
    }) => {
        let result = []

        let limitPerRequesters = limit

        if (useTidal) {
            limitPerRequesters = limitPerRequesters / 2
        }

        const requesters = [
            async () => {
                let { data } = await request({
                    instance: MusicModel.api_instance,
                    method: "GET",
                    url: `/tracks/liked`,
                    params: {
                        limit: limitPerRequesters,
                        offset,
                    },
                })

                return data
            },
            async () => {
                if (!useTidal) {
                    return {
                        total_length: 0,
                        tracks: [],
                    }
                }

                const tidalResult = await SyncModel.tidalCore.getMyFavoriteTracks({
                    limit: limitPerRequesters,
                    offset,
                })

                return tidalResult
            },
        ]

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

        let total_length = 0

        result.forEach((result) => {
            total_length += result.total_length
        })

        let tracks = result.reduce((acc, cur) => {
            return [...acc, ...cur.tracks]
        }, [])

        tracks = tracks.sort((a, b) => {
            return b.liked_at - a.liked_at
        })

        return {
            total_length,
            tracks,
        }
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