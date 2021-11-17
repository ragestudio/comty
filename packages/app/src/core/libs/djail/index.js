// Prototype for nodecore module
import { verbosity } from '@corenode/utils'
import store from 'store'

export class DJail {
    constructor(params) {
        this.storeKey = params.name
        this.voidMutation = params.voidMutation ?? false
        this.objectType = params.type ?? "object"
        this.data = null

        if (!this.storeKey) {
            throw new Error(`Invalid or missing store name`)
        }

        switch (this.objectType) {
            case "object": {
                this.data = new Object()
                break
            }
            case "array": {
                this.data = new Array()
                this.data[0] = {}
                break
            }

            default: {
                this.data = new Object()
                break
            }
        }
    }

    _pull() {
        const storaged = store.get(this.storeKey) 

        if (storaged) {
            this.data = store.get(this.storeKey)
        }

        return this.data
    }

    _push(update) {
        if (typeof update !== "undefined") {
            switch (this.objectType) {
                case "object": {
                    this.data = { ...this.data, ...update }
                }
                case "array": {
                    this.data = [...this.data, ...update]
                }
                default: {
                    break
                }
            }
        }

        store.set(this.storeKey, this.data)
    }

    getValue(key) {
        try {
            return this.get(key)[key]
        } catch (error) {
            verbosity.error(error)
            return false
        }
    }

    get(query) {
        this._pull()
        if (!query) {
            return this.data
        }

        let scope = []
        let matched = {}

        if (Array.isArray(query)) {
            scope = query
        } else {
            scope.push(query)
        }

        scope.forEach((key) => {
            switch (this.objectType) {
                case "object": {
                    matched[key] = this.data[key]
                    break
                }
                case "array": {
                    const adresses = this.data[0]
                    matched[key] = this.data[adresses[key]]
                    break
                }
                default: {
                    break
                }
            }

        })

        return matched
    }

    set(key, value) {
        this._pull()

        switch (this.objectType) {
            case "object": {
                if (typeof (value) == "undefined") {
                    if (!this.voidMutation) {
                        verbosity.warn(`voidMutation is enabled, no changes on key [${key}]`)
                        return settings
                    }
                    verbosity.warn(`voidMutation is not enabled, undefined values causes key removal`)
                }

                this.data[key] = value
                break
            }
            case "array": {
                this.data.push(value)
                this.data[0][key] = (this.data.length - 1)
                break
            }
            default: {
                break
            }
        }
        
        this._push()
        return this.data
    }

    remove(key) {
        switch (this.objectType) {
            case "object": {
                delete this.data[key]
                this._push()
                break
            }
            case "array": {
                this.data.filter(item => item.key !== key)
                break
            }
            default: {
                break
            }
        }

        return this.data
    }
}

export default DJail