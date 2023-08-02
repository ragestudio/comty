import store from "store"

export default class AudioPlayerStorage {
    static storeKey = "audioPlayer"

    static get(key) {
        const data = store.get(AudioPlayerStorage.storeKey)

        if (data) {
            return data[key]
        }

        return null
    }

    static set(key, value) {
        const data = store.get(AudioPlayerStorage.storeKey) ?? {}

        data[key] = value

        store.set(AudioPlayerStorage.storeKey, data)

        return data
    }
}