const settingsPaths = import.meta.glob("/constants/settings/*/index.jsx")

export default async () => {
    const settings = {}

    for (const [key, value] of Object.entries(settingsPaths)) {
        const path = key.split("/").slice(-2)
        const name = path[0]

        if (name === "components" || name === "index") {
            continue
        }

        if (!settings[name]) {
            settings[name] = {}
        }

        let setting = await value()

        setting = setting.default || setting

        settings[name] = setting
    }

    return settings
}