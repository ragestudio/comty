import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"
import { openModal as openWidgetsBrowserModal } from "@components/WidgetsBrowser"
import WidgetItemPreview from "@components/WidgetItemPreview"

import "./index.less"

export default class WidgetsManager extends React.Component {
    state = {
        loadedWidgets: app.cores.widgets.getInstalled() ?? [],
    }

    render() {
        return <div className="widgets-manager">
            <div className="widgets-manager-list">
                {
                    Array.isArray(this.state.loadedWidgets) && this.state.loadedWidgets.map((manifest) => {
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
                        onClick={openWidgetsBrowserModal}
                    >
                        Install more
                    </antd.Button>
                </div>
            </div>
        </div>
    }
}