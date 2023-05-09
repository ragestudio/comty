import React from "react"
import lodable from "@loadable/component"
import * as antd from "antd"

import { SortableList, SortableItem, DragHandle } from "components/SortableList"

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

        const RenderComponentCTX = {

        }

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
                <RenderComponent
                    ctx={RenderComponentCTX}
                />
            </div>
        } catch (error) {
            console.error(error)

            return <div className="widget_item">
                Invalid widget
            </div>
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

            console.log(`Generate widget ${virtualModule.manifest.id}`)

            return () => <WidgetComponent
                RenderComponent={RenderComponent}
                manifest={virtualModule.manifest}
                key={props.index}
                index={props.index}
                id={`${virtualModule.manifest.id}-${props.index}`}
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

export default class WidgetsWrapper extends React.Component {
    state = {
        widgetsRender: app.cores.settings.get("widgets.urls").map((url, index) => {
            return {
                id: `${url}_${index}`,
                url,
                RenderItem: generateRemoteComponent({
                    url,
                    index: index,
                })
            }
        }),
    }

    handleOnSortEnd = (widgetsRender) => {
        this.setState({
            widgetsRender
        })

        const urls = widgetsRender.map((widgetRender) => {
            return widgetRender.url
        })

        app.cores.settings.set("widgets.urls", urls)
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
                        id: "add",
                        icon: "Plus",
                        disabled: true,
                        onClick: () => {
                            // TODO: Open widget browser
                        }
                    },
                ]}
            />
        </div>
    }
}