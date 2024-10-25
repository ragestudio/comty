import MusicModel from "comty.js/models/music"

class ComtyMusicService {
    static id = "default"

    resolve = async (track_id) => {
        return await MusicModel.getTrackData(track_id)
    }

    resolveMany = async (track_ids, options) => {
        const response = await MusicModel.getTrackData(track_ids, options)

        if (response.list) {
            return response
        }

        return [response]
    }

    toggleTrackLike = async (manifest, to) => {
        return await MusicModel.toggleTrackLike(manifest, to)
    }
}

export default class ServiceProviders {
    providers = [
        new ComtyMusicService()
    ]

    findProvider(providerId) {
        return this.providers.find((provider) => provider.constructor.id === providerId)
    }

    register(provider) {
        this.providers.push(provider)
    }

    // operations
    resolve = async (providerId, manifest) => {
        const provider = await this.findProvider(providerId)

        if (!provider) {
            console.error(`Failed to resolve manifest, provider [${providerId}] not registered`)
            return manifest
        }

        return await provider.resolve(manifest)
    }

    resolveMany = async (manifests) => {
        manifests = manifests.map(async (manifest) => {
            return await this.resolve(manifest.service ?? "default", manifest)
        })

        manifests = await Promise.all(manifests)

        return manifests
    }
}