import axios from "axios"

const TIDAL_CLIENT_ID = process.env.TIDAL_CLIENT_ID
const TIDAL_CLIENT_SECRET = process.env.TIDAL_CLIENT_SECRET

function tranformTrackData(data = {}) {
	// TODO: Support Track remixes & versions
	data._id = data.id

	const coverUID = data.album.cover.replace(/-/g, "/")

	data.cover = `https://resources.tidal.com/images/${coverUID}/1080x1080.jpg`

	data.artist = data.artists.map(artist => artist.name).join(", ")

	data.metadata = {
		title: data.title,
		artists: data.artists.map(artist => artist.name).join(", "),
		artist: data.artists.map(artist => artist.name).join(", "),
		album: data.album.title,
		duration: data.duration,
	}

	data.service = "tidal"

	return data
}

export default class TidalAPI {
	static API_V1 = "https://api.tidal.com/v1"
	static API_V2 = "https://api.tidal.com/v2"

	static API_USERS = "https://api.tidal.com/v1/users"

	static async checkAuthStatus(device_code) {
		const data = {
			client_id: TIDAL_CLIENT_ID,
			device_code: device_code,
			grant_type: "urn:ietf:params:oauth:grant-type:device_code",
			scope: "r_usr+w_usr+w_sub",
		}

		const response = await axios({
			method: "POST",
			url: "https://auth.tidal.com/v1/oauth2/token",
			params: data,
			auth: {
				username: TIDAL_CLIENT_ID,
				password: TIDAL_CLIENT_SECRET,
			},
		}).catch(err => {
			return false
		})

		if (!response) {
			return false
		}

		return response.data
	}

	static async getAuthUrl() {
		let data = {
			client_id: TIDAL_CLIENT_ID,
			scope: "r_usr+w_usr+w_sub",
		}

		const response = await axios({
			method: "POST",
			url: "https://auth.tidal.com/v1/oauth2/device_authorization",
			params: data,
		})

		return {
			url: "https://" + response.data.verificationUri + "/" + response.data.userCode,
			device_code: response.data.deviceCode,
			expires_in: response.data.expiresIn,
		}
	}

	static async getUserData({ access_token, user_id, country }) {
		const url = `https://api.tidal.com/v1/users/${user_id}?countryCode=${country}`

		const response = await axios({
			method: "GET",
			url,
			headers: {
				Origin: "http://listen.tidal.com",
				Authorization: `Bearer ${access_token}`,
			},
		})

		return response.data
	}

	static async getTrackPlaybackUrl({ track_id, quality, access_token, country }) {
		let params = {
			countryCode: country ?? "US",
			audioquality: quality ?? "LOSSLESS",
			playbackmode: "STREAM",
			assetpresentation: "FULL",
		}

		let response = await axios({
			method: "GET",
			url: `https://api.tidal.com/v1/tracks/${track_id}/playbackinfopostpaywall`,
			params: params,
			headers: {
				Origin: "http://listen.tidal.com",
				Authorization: `Bearer ${access_token}`,
			},
		})

		let decodedManifest = JSON.parse(global.b64Decode(response.data.manifest))

		decodedManifest.url = decodedManifest.urls[0]

		return {
			metadata: {
				trackId: track_id,
				audioMode: response.data.audioMode,
				audioQuality: response.data.audioQuality,
				bitDepth: response.data.bitDepth,
				bitRate: response.data.bitRate,
				mimeType: response.data.manifestMimeType,
			},
			...decodedManifest,
		}
	}
	static async getTrackMetadata({ track_id, access_token, country }) {
		const response = await axios({
			method: "GET",
			url: `https://api.tidal.com/v1/tracks/${track_id}`,
			params: {
				countryCode: country,
			},
			headers: {
				Origin: "http://listen.tidal.com",
				Authorization: `Bearer ${access_token}`,
			},
		})

		return response.data
	}

	static async getTrackManifest({ track_id, quality, access_token, country }) {
		const playback = await TidalAPI.getTrackPlaybackUrl({
			track_id,
			quality,
			access_token,
			country,
		})

		const metadata = await TidalAPI.getTrackMetadata({
			track_id,
			access_token,
			country,
		})

		return {
			playback,
			metadata,
		}
	}

	static async search({ query, type = "all" }) {
		let url = `https://api.tidal.com/v1/search`

		switch (type) {
			case "all":
				url = `https://api.tidal.com/v1/search`
				break
			case "playlists":
				url = `https://api.tidal.com/v1/search/playlists`
				break
			case "artists":
				url = `https://api.tidal.com/v1/search/artists`
				break
			case "albums":
				url = `https://api.tidal.com/v1/search/albums`
				break
			case "tracks":
				url = `https://api.tidal.com/v1/search/tracks`
				break
		}

		const response = await axios({
			method: "GET",
			url: url,
			params: {
				query: query,
				countryCode: "AZ",
			},
			headers: {
				Origin: "http://listen.tidal.com",
				"x-tidal-token": TIDAL_CLIENT_ID,
			},
		})

		return response.data.tracks.items.map(item => {
			item = tranformTrackData(item)

			return item
		})
	}

	/**
	 * Retrieves favorite tracks for a user.
	 *
	 * @param {Object} options - The options for retrieving favorite tracks.
	 * @param {number} options.user_id - The user ID.
	 * @param {string} options.country - The country code.
	 * @param {string} options.access_token - The access token.
	 * @param {number} [options.limit=100] - The maximum number of tracks to retrieve.
	 * @param {number} [options.offset=0] - The offset for pagination.
	 * @return {Object} The response object containing the total length and tracks.
	 */
	static async getFavoriteTracks({
		user_id,
		access_token,
		country,
		limit = 100,
		offset = 0,
		order = "DATE",
		orderDirection = "DESC",
	}) {
		const response = await axios({
			url: `${TidalAPI.API_USERS}/${user_id}/favorites/tracks`,
			method: "GET",
			headers: {
				Origin: "http://listen.tidal.com",
				Authorization: `Bearer ${access_token}`,
			},
			params: {
				countryCode: country,
				order,
				orderDirection,
				limit,
				offset,
			},
		})

		response.data.items = response.data.items.map(item => {
			item.item = tranformTrackData(item.item)

			item.item.liked_at = new Date(item.created).getTime()
			item.item.liked = true
			item.item._computed = true

			return item.item
		})

		return {
			total_length: response.data.totalNumberOfItems,
			tracks: response.data.items,
		}
	}


	/**
	 * Retrieves self favorite playlists based on specified parameters.
	 *
	 * @param {Object} options - The options object.
	 * @param {string} options.country - The country code.
	 * @param {string} options.access_token - The access token for authentication.
	 * @param {number} [options.limit=100] - The maximum number of playlists to retrieve.
	 * @param {number} [options.offset=0] - The offset for pagination.
	 * @param {string} [options.order="DATE"] - The field to order the playlists by.
	 * @param {string} [options.orderDirection="DESC"] - The direction to order the playlists in.
	 * @return {Object} - An object containing the total length and items of the playlists.
	 */
	static async getFavoritePlaylists({
		country,
		access_token,
		limit = 100,
		offset = 0,
		order = "DATE",
		orderDirection = "DESC",
	}) {
		const params = {
			folderId: "root",
			deviceType: "BROWSER",
			countryCode: country,
			offset,
			limit,
			order,
			orderDirection,
		}

		let response = await axios({
			url: `${TidalAPI.API_V2}/my-collection/playlists/folders`,
			method: "GET",
			headers: {
				Origin: "http://listen.tidal.com",
				Authorization: `Bearer ${access_token}`,
				Server: "envoy",
			},
			params: params,
		})

		response.data.items = response.data.items.map(item => {
			item.data._id = item.data.uuid
			item.data.addedAt = item.addedAt
			item.data.created_at = item.addedAt

			item.data.service = "tidal"

			const coverUID = item.data.squareImage.replace(/-/g, "/")
			item.data.cover = `https://resources.tidal.com/images/${coverUID}/1080x1080.jpg`

			return item.data
		})

		return {
			total_length: response.data.totalNumberOfItems,
			items: response.data.items,
		}
	}

	/**
	 * Retrieves playlist items based on the provided parameters.
	 *
	 * @param {Object} options - The options for retrieving playlist items.
	 * @param {string} options.uuid - The UUID of the playlist.
	 * @param {number} options.limit - The maximum number of items to retrieve.
	 * @param {number} options.offset - The offset of items to start retrieving from.
	 * @param {string} options.country - The country code for retrieving items.
	 * @param {string} options.access_token - The access token for authentication.
	 * @return {Object} An object containing the total length and items of the playlist.
	 */
	static async getPlaylistItems({
		uuid,
		limit,
		offset,

		country,
		access_token,
	}) {
		const params = {
			limit,
			offset,
			countryCode: country,
		}

		let response = await axios({
			url: `${TidalAPI.API_V1}/playlists/${uuid}/items`,
			method: "GET",
			headers: {
				Origin: "http://listen.tidal.com",
				Authorization: `Bearer ${access_token}`,
				Server: "envoy",
			},
			params: params,
		})

		response.data.items = response.data.items.map((item) => {
			item = tranformTrackData(item.item)

			return item
		})

		return {
			total_length: response.data.totalNumberOfItems,
			list: response.data.items,
		}
	}

	/**
	 * Retrieves playlist data from the Tidal API.
	 *
	 * @param {Object} options - The options for retrieving the playlist data.
	 * @param {string} options.uuid - The UUID of the playlist.
	 * @param {string} options.access_token - The access token for authentication.
	 * @param {string} options.country - The country code for the playlist data.
	 * @param {boolean} [options.resolve_items=false] - Whether to resolve the playlist items.
	 * @param {number} [options.limit] - The maximum number of items to retrieve.
	 * @param {number} [options.offset] - The offset for pagination.
	 * @return {Object} The playlist data retrieved from the Tidal API.
	 */
	static async getPlaylistData({
		uuid,

		access_token,
		country,

		resolve_items = false,
		limit,
		offset,
	}) {
		const params = {
			countryCode: country,
		}

		let response = await axios({
			url: `${TidalAPI.API_V1}/playlists/${uuid}`,
			method: "GET",
			headers: {
				Origin: "http://listen.tidal.com",
				Authorization: `Bearer ${access_token}`,
				Server: "envoy",
			},
			params: params,
		})

		const coverUID = response.data.squareImage.replace(/-/g, "/")
		response.data.cover = `https://resources.tidal.com/images/${coverUID}/1080x1080.jpg`

		response.data.service = "tidal"

		if (resolve_items) {
			response.data.list = await TidalAPI.getPlaylistItems({
				uuid,
				limit,
				offset,
				access_token,
				country,
			})

			response.data.total_length = response.data.list.total_length
			response.data.list = response.data.list.list
		}

		return response.data
	}

	static async toggleTrackLike(track_id) {

	}

	static async togglePlaylistLike(playlist_id) {
		
	}
}
