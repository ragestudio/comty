export default class Settings {
    static get = (key) => {
        if (typeof window === "undefined") {
            return null
        }

        return window?.app?.cores?.settings.get(key)
    }

    static set = (key, value) => {
        if (typeof window === "undefined") {
            return null
        }

        return window?.app?.cores?.settings.set(key, value)
    }

    static is = (key) => {
        if (typeof window === "undefined") {
            return null
        }

        return window?.app?.cores?.settings.is(key)
    }
}