import AudioPlayerStorage from "../player.storage.js"

export default async (sampleRate) => {
    // must be a integer
    if (typeof sampleRate !== "number") {
        this.console.error("Sample rate must be a number")
        return null
    }

    // must be a integer
    if (!Number.isInteger(sampleRate)) {
        this.console.error("Sample rate must be a integer")
        return null
    }

    return await new Promise((resolve) => {
        app.confirm({
            title: "Change sample rate",
            content: `To change the sample rate, the app needs to be reloaded. Do you want to continue?`,
            onOk: () => {
                try {
                    AudioPlayerStorage.set("sample_rate", sampleRate)

                    app.navigation.reload()

                    return resolve(sampleRate)
                } catch (error) {
                    app.message.error(`Failed to change sample rate, ${error.message}`)
                    return resolve(null)
                }
            },
            onCancel: () => {
                return resolve(null)
            }
        })
    })
}