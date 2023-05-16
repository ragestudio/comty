export default class SpotifySyncModel {
    static get spotify_redirect_uri() {
        return window.location.origin + "/callbacks/sync/spotify"
    }

    static get spotify_authorize_endpoint() {
        return "https://accounts.spotify.com/authorize?response_type=code&client_id={{client_id}}&scope={{scope}}&redirect_uri={{redirect_uri}}&response_type=code"
    }

    static async authorizeAccount() {
        const scopes = [
            "user-read-private",
            "user-modify-playback-state",
            "user-read-currently-playing",
            "user-read-playback-state",
            "streaming",
        ]

        const { client_id } = await SpotifySyncModel.get_client_id()

        const parsedUrl = SpotifySyncModel.spotify_authorize_endpoint
            .replace("{{client_id}}", client_id)
            .replace("{{scope}}", scopes.join(" "))
            .replace("{{redirect_uri}}", SpotifySyncModel.spotify_redirect_uri)

        // open on a new tab
        window.open(parsedUrl, "_blank")
    }

    static async get_client_id() {
        const { data } = await app.cores.api.customRequest( {
            method: "GET",
            url: `/sync/spotify/client_id`,
        })

        return data
    }

    static async syncAuthCode(code) {
        const { data } = await app.cores.api.customRequest( {
            method: "POST",
            url: `/sync/spotify/auth`,
            data: {
                redirect_uri: SpotifySyncModel.spotify_redirect_uri,
                code,
            },
        })

        return data
    }

    static async unlinkAccount() {
        const { data } = await app.cores.api.customRequest( {
            method: "POST",
            url: `/sync/spotify/unlink`,
        })

        return data
    }

    static async isAuthorized() {
        const { data } = await app.cores.api.customRequest( {
            method: "GET",
            url: `/sync/spotify/is_authorized`,
        })

        return data
    }

    static async getData() {
        const { data } = await app.cores.api.customRequest( {
            method: "GET",
            url: `/sync/spotify/data`,
        })

        return data
    }

    static async getCurrentPlaying() {
        const { data } = await app.cores.api.customRequest( {
            method: "GET",
            url: `/sync/spotify/currently_playing`,
        })

        return data
    }
}