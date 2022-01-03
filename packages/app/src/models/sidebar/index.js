import store from 'store'
import defaultKeys from 'schemas/defaultSidebar.json'

class SidebarController {
    constructor() {
        this.storeKey = "app_sidebar"
        this.defaults = defaultKeys

        this.data = store.get(this.storeKey) ?? this.defaults
        return this
    }

    _pull = () => {
        this.data = [...this.data, ...store.get(this.storeKey)]
    }

    _push = (update) => {
        if (typeof update !== "undefined") {
            this.data = update
        }
        store.set(this.storeKey, this.data)
    }

    set = (value) => {
        this.data.push(value)
        this._push()

        return this.data
    }

    all = () => {
        let objs = []

        this.data.forEach((entry) => {
            objs.push(entry)
        })

        return objs
    }

    get = () => {
        return this.data
    }
}

export default SidebarController