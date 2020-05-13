import axios from 'axios'
import * as app from 'app'
import keys from 'keys'

export const api_unsplash = {
    search: async (key, callback) => {
        if (!key) return false
        const response = await axios.get(app.endpoints.unsplash_endpoints.search, {
            params: { query: key},
            headers: {
                Authorization: `Client-ID ${keys.unsplash_key}`
            }
        })
        return callback(response.data.results)
    }
} 