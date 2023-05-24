import request from "../../handlers/request"
import Settings from "../../helpers/withSettings"

export default class FeedModel {
    static getMusicFeed = async ({ trim, limit } = {}) => {
        const { data } = await request({
            method: "GET",
            url: `/feed/music`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? Settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static getGlobalMusicFeed = async ({ trim, limit } = {}) => {
        const { data } = await request({
            method: "GET",
            url: `/feed/music/global`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? Settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static getTimelineFeed = async ({ trim, limit } = {}) => {
        const { data } = await request({
            method: "GET",
            url: `/feed/timeline`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? Settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static getPostsFeed = async ({ trim, limit } = {}) => {
        const { data } = await request({
            method: "GET",
            url: `/feed/posts`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? Settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static getPlaylistsFeed = async ({ trim, limit } = {}) => {
        const { data } = await request({
            method: "GET",
            url: `/feed/playlists`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? Settings.get("feed_max_fetch"),
            }
        })

        return data
    }
}