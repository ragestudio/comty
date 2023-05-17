import loadable from "@loadable/component"

export default {
    id: "widgets",
    icon: "List",
    label: "Widgets",
    group: "app",
    settings: [
        {
            id: "widgets.urls",
            title: "Widgets",
            group: "general",
            icon: "List",
            component: loadable(() => import("../components/widgetsView")),
            defaultValue: () => {
                if (typeof app.cores.widgets === "undefined") {
                    return []
                }

                return app.cores.widgets.getInstalled()
            },
            reloadValueOnUpdateEvent: "widgets:update",
            storaged: false,
        }
    ]
}