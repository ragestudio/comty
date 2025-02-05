import ComtyMusicServiceInterface from "../providers/comtymusic"

export default class ServiceProviders {
    providers = [
        // add by default here
        new ComtyMusicServiceInterface()
    ]

    findProvider(providerId) {
        return this.providers.find((provider) => provider.constructor.id === providerId)
    }

    register(provider) {
        this.providers.push(provider)
    }

    has(providerId) {
        return this.providers.some((provider) => provider.constructor.id === providerId)
    }

    operation = async (operationName, providerId, manifest, args) => {
        const provider = await this.findProvider(providerId)

        if (!provider) {
            console.error(`Failed to resolve manifest, provider [${providerId}] not registered`)
            return manifest
        }

        const operationFn = provider[operationName]

        if (typeof operationFn !== "function") {
            console.error(`Failed to resolve manifest, provider [${providerId}] operation [${operationName}] not found`)
            return manifest
        }

        return await operationFn(manifest, args)
    }

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