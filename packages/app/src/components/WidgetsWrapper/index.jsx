import React from "react"
import lodable from "@loadable/component"
import * as antd from "antd"

import { SortableList, SortableItem } from "components/SortableList"

import StoragedState from "utils/storagedState"

import "./index.less"

class WidgetComponent extends React.Component {
    state = {
        mountedCssFiles: [],
        loading: true,
    }

    componentDidMount = async () => {
        if (Array.isArray(this.props.manifest.cssFiles)) {
            for await (const cssFile of this.props.manifest.cssFiles) {
                const cssFileElement = document.createElement("link")

                cssFileElement.rel = "stylesheet"
                cssFileElement.href = cssFile

                document.head.appendChild(cssFileElement)

                await this.setState({
                    mountedCssFiles: [
                        ...this.state.mountedCssFiles,
                        cssFileElement,
                    ]
                })

                continue
            }
        }

        this.setState({
            loading: false,
        })
    }

    componentWillUnmount() {
        this.state.mountedCssFiles.forEach((cssFileElement) => {
            cssFileElement.remove()
        })
    }

    // catch if render error
    componentDidCatch = (error, errorInfo) => {
        console.error(error, errorInfo)

        this.setState({
            loading: false,
            renderError: error,
        })
    }

    render() {
        const { RenderComponent, manifest } = this.props

        if (this.state.renderError) {
            return <div className="widget_item">
                <antd.Result
                    status="error"
                    title="Failed to render widget"
                    subTitle={this.state.renderError.message}
                />
            </div>
        }

        if (this.state.loading) {
            return <div className="widget_item">
                <antd.Skeleton active />
            </div>
        }

        try {
            if (!manifest) {
                throw new Error("Widget has no manifest")
            }

            if (!RenderComponent) {
                throw new Error("Widget has not valid render")
            }

            return <div
                className="widget_item"
                id={manifest.id}
            >
                <RenderComponent />
            </div>
        } catch (error) {
            console.error(error)

            return <div className="widget_item">
                Invalid widget
            </div>
        }
    }
}

function extendsWidgetClass(parentClass, ctx) {
    return class extends parentClass {
        constructor(...args) {
            super(...args)

            this.ctx = ctx

            if (typeof this.__entry_init === "function") {
                this.__entry_init()
            }
        }

        __entry_init = async () => {

        }
    }
}

const generateRemoteComponent = (props) => {
    return lodable(async () => {
        try {
            let virtualModule = await import(props.url)

            virtualModule = virtualModule.default

            if (!virtualModule) {
                throw new Error("Widget has not valid module")
            }

            let RenderComponent = virtualModule.renderComponent

            if (!RenderComponent) {
                throw new Error("Widget has not valid render")
            }

            console.log(`🔄 Generating widget [${virtualModule.manifest.name}]`)

            let ctx = Object()

            // check if static storagedStateKey exists on RenderComponent
            if (RenderComponent.storagedStateKey) {
                const storagedStateEngine = new StoragedState()

                const defaultValue = await storagedStateEngine.getState(RenderComponent.storagedStateKey)

                ctx["storagedState"] = class {
                    static get defaultValue() {
                        return defaultValue
                    }

                    static setState = async (value) => {
                        return await storagedStateEngine.setState(RenderComponent.storagedStateKey, value)
                    }

                    static getState = async () => {
                        return await storagedStateEngine.getState(RenderComponent.storagedStateKey)
                    }
                }
            }

            RenderComponent = extendsWidgetClass(RenderComponent, ctx)

            return () => <WidgetComponent
                RenderComponent={RenderComponent}
                manifest={virtualModule.manifest}
                key={props.index}
                index={props.index}
                id={`${virtualModule.manifest.name}-${props.index}`}
            />
        } catch (error) {
            console.error(error)

            return () => <div className="widget_item">
                Error loading widget
            </div>
        }
    }, {
        fallback: <antd.Skeleton active />
    })
}

function getWidgets() {
    let installedWidgets = app.cores.widgets.getInstalled()

    // filter widgets that are not visible
    installedWidgets = installedWidgets.filter((widget) => {
        return widget.visible
    })

    return installedWidgets.map((manifest, index) => {
        return {
            name: manifest.name,
            id: manifest._id,
            url: manifest.uri,
            RenderItem: generateRemoteComponent({
                url: manifest.uri,
                index: index,
            })
        }
    })
}

export default class WidgetsWrapper extends React.Component {
    state = {
        widgetsRender: getWidgets(),
    }

    events = {
        "widgets:installed": () => {
            this.loadWidgets()
        },
        "widgets:uninstalled": () => {
            this.loadWidgets()
        }
    }

    componentDidMount() {
        for (const [eventName, eventHandler] of Object.entries(this.events)) {
            app.eventBus.on(eventName, eventHandler)
        }
    }

    componentWillUnmount() {
        for (const [eventName, eventHandler] of Object.entries(this.events)) {
            app.eventBus.off(eventName, eventHandler)
        }
    }

    handleOnSortEnd = (widgetsRender) => {
        this.setState({
            widgetsRender
        })

        app.cores.widgets.sort(widgetsRender)
    }

    loadWidgets = () => {
        this.setState({
            widgetsRender: getWidgets(),
        })
    }

    render() {
        return <div className="widgets_wrapper">
            <SortableList
                items={this.state.widgetsRender}
                onChange={this.handleOnSortEnd}
                renderItem={(item, index) => {
                    const RenderItem = item.RenderItem
                    return <SortableItem id={item.id}>
                        <RenderItem />
                    </SortableItem>
                }}
                useDragOverlay
                activeDragActions={[
                    {
                        id: "settings",
                        icon: "Settings",
                        onClick: () => {
                            app.location.push("/settings?tab=widgets")
                        }
                    },
                ]}
            />
        </div>
    }
}