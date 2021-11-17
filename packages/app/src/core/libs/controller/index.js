import { verbosity } from '@corenode/utils'
const inmutableKey = ["_params"]

export class Controller {
    constructor(params) {
        this.params = params

        this.id = params.id
        // this.scope = ["window"]
        this.scopeWindow = params.scopeWindow ?? true

        this.freezedKeys = []
        this.lockController = params.locked ?? false

        this.register({ _params: params })
    }

    _canDestroy(key) {
        if (!inmutableKey.includes(key) && !this.freezedKeys.includes(key)) {
            return true
        }
        return false
    }

    _initWindowScope() {
        if (typeof (window.controllers) == "undefined") {
            window.controllers = Object
        }
    }

    register(controller) {
        // this.scope.forEach((key, index) => {

        // })
        if (this.scopeWindow) {
            if (typeof (window.controllers) == "undefined") {
                this._initWindowScope()
            }

            window.controllers[this.id] = controller
        }
    }

    freeze = {
        _keys: () => {
            return this.freezedKeys
        },
        isLock: (key) => {
            if (key === "_self") {
                return this.lockController
            }

            return this._canDestroy(key)
        },
        lock: (key) => {
            if (key === "_self") {
                return this.lockController = true
            }
            this.freezedKeys.push(key)
        },
        unlock: (key) => {
            if (key === "_self") {
                return this.lockController = false
            }

            const updated = this.freezedKeys.filter(function (value, index, arr) {
                return value !== key
            })
            this.freezedKeys = updated
        }
    }

    add(key, method, options, events) {
        this[key] = method
        
        window.controllers[this.id][key] = method

        if (options?.lock) {
            this.freeze.lock(key)
        }
    }

    remove(key) {
        if (this._canDestroy(key)) {
            return delete window.controllers[this.id][key]
        }
        verbosity.warn(`It is not possible to destroy this key because it is locked`)
    }

    destroy() {
        if (!this.lockController) {
            return delete window.controllers[this.id]
        }
        verbosity.warn(`It is not possible to destroy this controller because it is locked`)
    }
}

export default Controller