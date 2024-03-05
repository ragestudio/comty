import jscookies from "js-cookie"

class InternalStorage {
    #storage = {}

    get(key) {
        // get value from storage
        return this.#storage[key]
    }

    set(key, value) {
        // storage securely in memory
        return this.#storage[key] = value
    }
}

export default class Storage {
    static get engine() {
        // check if is running in browser, if is import js-cookie
        // else use in-memory safe storage
        if (typeof window !== "undefined") {
            return jscookies
        }

        if (!globalThis.__comty_shared_state["_internal_storage"]) {
            globalThis.__comty_shared_state["_internal_storage"] = new InternalStorage()
        }

        return globalThis.__comty_shared_state["_internal_storage"]
    }
}