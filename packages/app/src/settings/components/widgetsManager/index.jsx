import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"
import { openModal as openWidgetsBrowserModal } from "@components/WidgetsBrowser"
import WidgetItemPreview from "@components/WidgetItemPreview"

import "./index.less"

const WidgetsManager = () => {
    const [loadedWidgets, setLoadedWidgets] = React.useState(app.cores.widgets.getInstalled() ?? [])

    React.useEffect(() => {
        if (app.layout.tools_bar) {
            app.layout.tools_bar.toggleVisibility(true)
        }
    }, [])

    return <div className="widgets-manager">
        <h1>Widgets</h1>

        <div className="widgets-manager-list">
            {
                Array.isArray(loadedWidgets) && loadedWidgets.map((manifest) => {
                    return <React.Fragment>
                        <WidgetItemPreview
                            manifest={manifest}
                            onRemove={() => {
                                app.cores.widgets.uninstall(manifest._id)
                            }}
                            onInstall={() => {
                                app.cores.widgets.install(manifest._id)
                            }}
                            onUpdate={() => {
                                app.cores.widgets.install(manifest._id, {
                                    update: true,
                                })
                            }}
                            onChangeVisible={(visible) => {
                                app.cores.widgets.toggleVisibility(manifest._id, visible)
                            }}
                        />
                    </React.Fragment>
                })
            }

            <div
                className="widget_load_list_item"
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <antd.Button
                    type="primary"
                    icon={<Icons.FiPlus />}
                    onClick={() => { }}
                >
                    Install more
                </antd.Button>
            </div>
        </div>
    </div>
}

export default WidgetsManager