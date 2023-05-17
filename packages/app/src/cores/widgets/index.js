import Core from "evite/src/core"
import store from "store"

export default class WidgetsCore extends Core {
    static namespace = "widgets"
    static storeKey = "widgets"

    static get apiInstance() {
        return app.cores.api.instance().instances.marketplace
    }

    public = {
        getInstalled: this.getInstalled.bind(this),
        isInstalled: this.isInstalled.bind(this),
        install: this.install.bind(this),
        uninstall: this.uninstall.bind(this),
        toogleVisibility: this.toogleVisibility.bind(this),
        isVisible: this.isVisible.bind(this),
        sort: this.sort.bind(this),
    }

    async onInitialize() {
        try {
            await WidgetsCore.apiInstance()

            const currentStore = this.getInstalled()

            if (!Array.isArray(currentStore)) {
                store.set(WidgetsCore.storeKey, [])
            }
        } catch (error) {
            console.error(error)
        }
    }

    getInstalled() {
        return store.get(WidgetsCore.storeKey) ?? []
    }

    isInstalled(widget_id) {
        const widgets = this.getInstalled()

        console.log(widgets)

        const widget = widgets.find((widget) => widget._id === widget_id)

        return !!widget
    }

    async install(widget_id, params = {}) {
        if (!widget_id || typeof widget_id !== "string") {
            throw new Error("Widget id must be a string.")
        }

        console.debug(`🧩 Installing widget with id [${widget_id}]`)

        // get manifest
        let manifest = await WidgetsCore.apiInstance({
            method: "GET",
            url: `/widgets/${widget_id}/manifest`,
        }).catch((error) => {
            console.error(error)
            app.message.error("Cannot install widget.")

            return false
        })

        if (!manifest) {
            return false
        }

        manifest = manifest.data

        // check if already installed
        if (this.isInstalled(widget_id) && !params.update) {
            app.message.error("Widget already installed.")

            return false
        }

        // save manifest
        let currentStore = this.getInstalled()

        manifest.uri = `${WidgetsCore.apiInstance.defaults.baseURL}/widgets/${manifest._id}`

        if (params.update) {
            const installationIndex = currentStore.findIndex((widget) => {
                return widget._id === manifest._id
            })

            if (installationIndex === -1) {
                app.message.error("Cannot find widget to update.")

                return false
            }

            currentStore[installationIndex] = {
                ...currentStore[installationIndex],
                ...manifest,
            }
        } else {
            // set visible by default
            manifest.visible = true

            currentStore.push(manifest)
        }

        store.set(WidgetsCore.storeKey, currentStore)

        app.notification.new({
            title: params.update ? "Widget updated" : "Widget installed",
            description: `Widget [${manifest.name}] has been ${params.update ? "updated" : "installed"}. ${params.update ? `Using current version ${manifest.version}` : ""}`,
        }, {
            type: "success",
        })

        app.eventBus.emit("widgets:update", currentStore)
        app.eventBus.emit("widgets:installed", manifest)

        return manifest
    }

    uninstall(widget_id) {
        if (!widget_id || typeof widget_id !== "string") {
            throw new Error("Widget id must be a string.")
        }

        console.debug(`🧩 Uninstalling widget with id [${widget_id}]`)

        // check if already installed
        if (!this.isInstalled(widget_id)) {
            app.message.error("Widget not installed.")

            return false
        }

        // remove manifest
        const currentStore = this.getInstalled()

        const newStore = currentStore.filter((widget) => widget._id !== widget_id)

        store.set(WidgetsCore.storeKey, newStore)

        app.notification.new({
            title: "Widget uninstalled",
            description: `Widget [${widget_id}] has been uninstalled.`,
        }, {
            type: "success",
        })

        app.eventBus.emit("widgets:update", currentStore)
        app.eventBus.emit("widgets:uninstalled", widget_id)

        return true
    }

    toogleVisibility(widget_id, to) {
        if (!widget_id || typeof widget_id !== "string") {
            throw new Error("Widget id must be a string.")
        }

        // check if already installed
        if (!this.isInstalled(widget_id)) {
            app.message.error("Widget not installed.")

            return false
        }

        // remove manifest
        const currentStore = this.getInstalled()

        const newStore = currentStore.map((widget) => {
            if (widget._id === widget_id) {
                widget.visible = to
            }

            return widget
        })

        store.set(WidgetsCore.storeKey, newStore)

        app.eventBus.emit("widgets:update", currentStore)
        app.eventBus.emit("widgets:visibility", widget_id, to)

        return true
    }

    isVisible(widget_id) {
        if (!widget_id || typeof widget_id !== "string") {
            throw new Error("Widget id must be a string.")
        }

        // check if already installed
        if (!this.isInstalled(widget_id)) {
            return false
        }

        // remove manifest
        const currentStore = this.getInstalled()

        const widget = currentStore.find((widget) => widget._id === widget_id)

        return widget.visible
    }

    sort(order) {
        if (!Array.isArray(order)) {
            throw new Error("Order must be an array.")
        }

        const currentStore = this.getInstalled()

        const newStore = currentStore.sort((a, b) => {
            return order.findIndex((_a) => _a.id === a._id) - order.findIndex((_b) => _b.id === b._id)
        })

        store.set(WidgetsCore.storeKey, newStore)

        app.eventBus.emit("widgets:update", currentStore)
        app.eventBus.emit("widgets:sort", order)

        return true
    }
}