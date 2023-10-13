import request from "../../handlers/request"
import pmap from "p-map"
import SyncModel from "../sync"

export default class MusicModel {
    static get api_instance() {
        return globalThis.__comty_shared_state.instances["music"]
    }

    /**
     * Retrieves track data for a given ID.
     *
     * @param {string} id - The ID of the track.
     * @return {Promise<Object>} The track data.
     */
    static async getTrackData(id) {
        const response = await request({
            instance: MusicModel.api_instance,
            method: "GET",
            url: `/tracks/${id}/data`,
        })

        return response.data
    }

    /**
     * Retrieves tracks data for the given track IDs.
     *
     * @param {Array} ids - An array of track IDs.
     * @return {Promise<Object>} A promise that resolves to the tracks data.
     */
    static async getTracksData(ids) {
        const response = await request({
            instance: MusicModel.api_instance,
            method: "GET",
            url: `/tracks/many`,
            params: {
                ids,
            }
        })

        return response.data
    }

    /**
     * Retrieves favorite tracks based on specified parameters.
     *
     * @param {Object} options - The options for retrieving favorite tracks.
     * @param {boolean} options.useTidal - Whether to use Tidal for retrieving tracks. Defaults to false.
     * @param {number} options.limit - The maximum number of tracks to retrieve.
     * @param {number} options.offset - The offset from which to start retrieving tracks.
     * @return {Promise<Object>} - An object containing the total length of the tracks and the retrieved tracks.
     */
    static async getFavoriteTracks({ useTidal = false, limit, offset }) {
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
            async requester => {
                const data = await requester()

                return data
            },
            {
                concurrency: 3,
            },
        )

        let total_length = 0

        result.forEach(result => {
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

    /**
     * Retrieves favorite playlists based on the specified parameters.
     *
     * @param {Object} options - The options for retrieving favorite playlists.
     * @param {number} options.limit - The maximum number of playlists to retrieve. Default is 50.
     * @param {number} options.offset - The offset of playlists to retrieve. Default is 0.
     * @param {Object} options.services - The services to include for retrieving playlists. Default is an empty object.
     * @param {string} options.keywords - The keywords to filter playlists by.
     * @return {Promise<Object>} - An object containing the total length of the playlists and the playlist items.
     */
    static async getFavoritePlaylists({ limit = 50, offset = 0, services = {}, keywords } = {}) {
        let result = []

        let limitPerRequesters = limit

        const requesters = [
            async () => {
                const { data } = await request({
                    instance: MusicModel.api_instance,
                    method: "GET",
                    url: `/playlists/self`,
                    params: {
                        keywords,
                    },
                })

                return data
            },
        ]

        if (services["tidal"] === true) {
            limitPerRequesters = limitPerRequesters / (requesters.length + 1)

            requesters.push(async () => {
                const _result = await SyncModel.tidalCore.getMyFavoritePlaylists({
                    limit: limitPerRequesters,
                    offset,
                })

                return _result
            })
        }

        result = await pmap(
            requesters,
            async requester => {
                const data = await requester()

                return data
            },
            {
                concurrency: 3,
            },
        )

        // calculate total length
        let total_length = 0

        result.forEach(result => {
            total_length += result.total_length
        })

        // reduce items
        let items = result.reduce((acc, cur) => {
            return [...acc, ...cur.items]
        }, [])


        // sort by created_at
        items = items.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at)
        })

        return {
            total_length: total_length,
            items,
        }
    }

    /**
     * Retrieves playlist items based on the provided parameters.
     *
     * @param {Object} options - The options object.
     * @param {string} options.playlist_id - The ID of the playlist.
     * @param {string} options.service - The service from which to retrieve the playlist items.
     * @param {number} options.limit - The maximum number of items to retrieve.
     * @param {number} options.offset - The number of items to skip before retrieving.
     * @return {Promise<Object>} Playlist items data.
     */
    static async getPlaylistItems({
        playlist_id,
        service,

        limit,
        offset,
    }) {
        if (service === "tidal") {
            const result = await SyncModel.tidalCore.getPlaylistItems({
                playlist_id,

                limit,
                offset,

                resolve_items: true,
            })

            return result
        }

        const { data } = await request({
            instance: MusicModel.api_instance,
            method: "GET",
            url: `/playlists/${playlist_id}/items`,
            params: {
                limit,
                offset,
            }
        })

        return data
    }

    /**
     * Retrieves playlist data based on the provided parameters.
     *
     * @param {Object} options - The options object.
     * @param {string} options.playlist_id - The ID of the playlist.
     * @param {string} options.service - The service to use.
     * @param {number} options.limit - The maximum number of items to retrieve.
     * @param {number} options.offset - The offset for pagination.
     * @return {Promise<Object>} Playlist data.
     */
    static async getPlaylistData({
        playlist_id,
        service,

        limit,
        offset,
    }) {
        if (service === "tidal") {
            const result = await SyncModel.tidalCore.getPlaylistData({
                playlist_id,

                limit,
                offset,

                resolve_items: true,
            })

            return result
        }

        const { data } = await request({
            instance: MusicModel.api_instance,
            method: "GET",
            url: `/playlists/${playlist_id}/data`,
            params: {
                limit,
                offset,
            }
        })

        return data
    }

    /**
     * Performs a search based on the provided keywords, with optional parameters for limiting the number of results and pagination.
     *
     * @param {string} keywords - The keywords to search for.
     * @param {object} options - An optional object containing additional parameters.
     * @param {number} options.limit - The maximum number of results to return. Defaults to 5.
     * @param {number} options.offset - The offset to start returning results from. Defaults to 0.
     * @param {boolean} options.useTidal - Whether to use Tidal for the search. Defaults to false.
     * @return {Promise<Object>} The search results.
     */
    static async search(keywords, { limit = 5, offset = 0, useTidal = false }) {
        const { data } = await request({
            instance: MusicModel.api_instance,
            method: "GET",
            url: `/search`,
            params: {
                keywords,
                limit,
                offset,
                useTidal,
            },
        })

        return data
    }

    /**
     * Creates a new playlist.
     *
     * @param {object} payload - The payload containing the data for the new playlist.
     * @return {Promise<Object>} The new playlist data.
     */
    static async newPlaylist(payload) {
        const { data } = await request({
            instance: MusicModel.api_instance,
            method: "POST",
            url: `/playlists/new`,
            data: payload,
        })

        return data
    }

    /**
     * Updates a playlist item in the specified playlist.
     *
     * @param {string} playlist_id - The ID of the playlist to update.
     * @param {object} item - The updated playlist item to be added.
     * @return {Promise<Object>} - The updated playlist item.
     */
    static async putPlaylistItem(playlist_id, item) {
        const response = await request({
            instance: MusicModel.api_instance,
            method: "PUT",
            url: `/playlists/${playlist_id}/items`,
            data: item,
        })

        return response.data
    }

    /**
     * Delete a playlist item.
     *
     * @param {string} playlist_id - The ID of the playlist.
     * @param {string} item_id - The ID of the item to delete.
     * @return {Promise<Object>} The data returned by the server after the item is deleted.
     */
    static async deletePlaylistItem(playlist_id, item_id) {
        const response = await request({
            instance: MusicModel.api_instance,
            method: "DELETE",
            url: `/playlists/${playlist_id}/items/${item_id}`,
        })

        return response.data
    }

    /**
     * Deletes a playlist.
     *
     * @param {number} playlist_id - The ID of the playlist to be deleted.
     * @return {Promise<Object>} The response data from the server.
     */
    static async deletePlaylist(playlist_id) {
        const response = await request({
            instance: MusicModel.api_instance,
            method: "DELETE",
            url: `/playlists/${playlist_id}`,
        })

        return response.data
    }

    /**
     * Execute a PUT request to update or create a release.
     *
     * @param {object} payload - The payload data.
     * @return {Promise<Object>} The response data from the server.
     */
    static async putRelease(payload) {
        const response = await request({
            instance: MusicModel.api_instance,
            method: "PUT",
            url: `/releases/release`,
            data: payload
        })

        return response.data
    }


    /**
     * Retrieves the releases associated with the authenticated user.
     *
     * @param {string} keywords - The keywords to filter the releases by.
     * @return {Promise<Object>} A promise that resolves to the data of the releases.
     */
    static async getMyReleases(keywords) {
        const response = await request({
            instance: MusicModel.api_instance,
            method: "GET",
            url: `/releases/self`,
            params: {
                keywords,
            }
        })

        return response.data
    }


    /**
     * Retrieves releases based on the provided parameters.
     *
     * @param {object} options - The options for retrieving releases.
     * @param {string} options.user_id - The ID of the user.
     * @param {string[]} options.keywords - The keywords to filter releases by.
     * @param {number} options.limit - The maximum number of releases to retrieve.
     * @param {number} options.offset - The offset for paginated results.
     * @return {Promise<Object>} - A promise that resolves to the retrieved releases.
     */
    static async getReleases({
        user_id,
        keywords,
        limit = 50,
        offset = 0,
    }) {
        const response = await request({
            instance: MusicModel.api_instance,
            method: "GET",
            url: `/releases/user/${user_id}`,
            params: {
                keywords,
                limit,
                offset,
            }
        })

        return response.data
    }

    /**
     * Retrieves release data by ID.
     *
     * @param {number} id - The ID of the release.
     * @return {Promise<Object>} The release data.
     */
    static async getReleaseData(id) {
        const response = await request({
            instance: MusicModel.api_instance,
            method: "GET",
            url: `/releases/${id}/data`
        })

        return response.data
    }

    /**
     * Deletes a release by its ID.
     *
     * @param {string} id - The ID of the release to delete.
     * @return {Promise<Object>} - A Promise that resolves to the data returned by the API.
     */
    static async deleteRelease(id) {
        const response = await request({
            instance: MusicModel.api_instance,
            method: "DELETE",
            url: `/releases/${id}`
        })

        return response.data
    }

    /**
     * Refreshes the track cache for a given track ID.
     *
     * @param {string} track_id - The ID of the track to refresh the cache for.
     * @throws {Error} If track_id is not provided.
     * @return {Promise<Object>} The response data from the API call.
     */
    static async refreshTrackCache(track_id) {
        if (!track_id) {
            throw new Error("Track ID is required")
        }

        const response = await request({
            instance: MusicModel.api_instance,
            method: "POST",
            url: `/tracks/${track_id}/refresh-cache`,
        })

        return response.data
    }

    /**
     * Toggles the like status of a track.
     *
     * @param {Object} manifest - The manifest object containing track information.
     * @param {boolean} to - The like status to toggle (true for like, false for unlike).
     * @throws {Error} Throws an error if the manifest is missing.
     * @return {Object} The response data from the API.
     */
    static async toggleTrackLike(manifest, to) {
        if (!manifest) {
            throw new Error("Manifest is required")
        }

        console.log(`Toggling track ${manifest._id} like status to ${to}`)

        const track_id = manifest._id

        switch (manifest.service) {
            case "tidal": {
                const response = await SyncModel.tidalCore.toggleTrackLike({
                    track_id,
                    to,
                })

                return response
            }
            default: {
                const response = await request({
                    instance: MusicModel.api_instance,
                    method: to ? "POST" : "DELETE",
                    url: `/tracks/${track_id}/like`,
                    params: {
                        service: manifest.service
                    }
                })

                return response.data
            }
        }
    }
}
