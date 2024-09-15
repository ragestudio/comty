import React from "react"
import classnames from "classnames"
import * as antd from "antd"

import { createIconRender } from "@components/Icons"

import NavMenu from "./components/NavMenu"

import "./index.less"

export class Tab extends React.Component {
    state = {
        error: null
    }

    // handle on error
    componentDidCatch(err) {
        this.setState({ error: err })
    }

    render() {
        if (this.state.error) {
            return <antd.Result
                status="error"
                title="Error"
                subTitle={this.state.error}
            />
        }

        return <>
            {this.props.children}
        </>
    }
}

export const Panel = (props) => {
    return <div
        {...props.props ?? {}}
        className={classnames(
            "panel",
            props.align,
            props.className
        )}
    >
        {props.children}
    </div>
}

export class PagePanelWithNavMenu extends React.Component {
    state = {
        activeTab: new URLSearchParams(window.location.hash.replace("#", "?")).get("type") ?? this.props.defaultTab ?? this.props.tabs[0].key,
        renders: [],
    }

    primaryPanelRef = React.createRef()

    interface = {
        attachComponent: (id, component, options) => {
            const renders = this.state.renders

            renders.push({
                id: id,
                component: component,
                options: options,
                ref: React.createRef()
            })

            this.setState({
                renders: renders,
            })
        },
        detachComponent: (id) => {
            const renders = this.state.renders

            const index = renders.findIndex((render) => render.id === id)

            renders.splice(index, 1)

            this.setState({
                renders: renders,
            })
        }
    }

    componentDidMount() {
        app.layout.page_panels = this.interface

        if (app.isMobile) {
            app.layout.top_bar.shouldUseTopBarSpacer(true)
            app.layout.toggleCenteredContent(false)
        }

        app.layout.toggleCenteredContent(true)
    }

    componentWillUnmount() {
        delete app.layout.page_panels

        if (!app.isMobile) {
            app.layout.header.render(null)
        } else {
            app.layout.top_bar.renderDefault()
        }
    }

    renderActiveTab() {
        if (!Array.isArray(this.props.tabs)) {
            console.error("PagePanelWithNavMenu: tabs must be an array")
            return <></>
        }

        if (this.props.tabs.length === 0) {
            return <></>
        }

        // slip the active tab by splitting on "."
        if (!this.state.activeTab) {
            console.error("PagePanelWithNavMenu: activeTab is not defined")
            return <></>
        }

        let tab = null

        const activeTabDirectory = this.state.activeTab.split(".")

        activeTabDirectory.forEach((key, index) => {
            if (!tab) {
                tab = this.props.tabs.find((children) => children.key === key)
            } else {
                if (!tab.children) {
                    console.error("PagePanelWithNavMenu: tab.children is not defined")

                    return tab = null
                }

                tab = tab.children.find((children) => children.key === `${activeTabDirectory[index - 1]}.${key}`)
            }
        })

        if (!tab) {
            if (this.props.onNotFound) {
                return this.props.onNotFound()
            }

            return <antd.Result
                status="404"
                title="404"
                subTitle="Sorry, the tab you visited does not exist."
            />
        }

        const componentProps = tab.props ?? this.props.tabProps

        return React.createElement(tab.component, {
            ...componentProps,
        })
    }

    replaceQueryTypeToCurrentTab = (key) => {
        document.location.hash = `type=${key ?? this.state.activeTab}`
    }

    tabChange = async (key) => {
        if (this.props.beforeTabChange) {
            await this.props.beforeTabChange(key)
        }

        await this.setState({ activeTab: key })

        if (this.props.useSetQueryType) {
            this.replaceQueryTypeToCurrentTab(key)
        }

        if (this.props.onTabChange) {
            this.props.onTabChange(key)
        }
    }

    handleTabChange = async (key) => {
        if (this.state.activeTab === key) return

        if (this.props.transition) {
            if (document.startViewTransition) {
                return document.startViewTransition(() => {
                    this.tabChange(key)
                })
            }

            console.warn("PagePanelWithNavMenu: transition is enabled but document.startViewTransition is not compatible with your browser")

            if (this.primaryPanelRef.current && this.primaryPanelRef.current?.classList) {
                // set to primary panel fade-opacity-leave class
                this.primaryPanelRef.current.classList.add("fade-opacity-leave")

                // remove fade-opacity-leave class after animation
                setTimeout(() => {
                    this.primaryPanelRef.current.classList.remove("fade-opacity-leave")
                }, 300)
            }

            await new Promise(resolve => setTimeout(resolve, 200))
        }

        return this.tabChange(key)
    }

    getItems = (items) => {
        if (!Array.isArray(items)) {
            console.error(`[items] is not an (array), received (${typeof items})`)
            return []
        }

        items = items.map((item) => {
            return {
                key: item.key,
                icon: createIconRender(item.icon),
                label: item.label,
                children: item.children && this.getItems(item.children),
                disabled: item.disabled,
                props: item.props ?? {},
            }
        })

        return items
    }

    render() {
        return <>
            {
                app.isMobile && app.layout.top_bar.render(<NavMenu
                    activeKey={this.state.activeTab}
                    items={this.getItems(this.props.tabs)}
                    onClickItem={(key) => this.handleTabChange(key)}
                />)
            }

            {
                !app.isMobile && app.layout.header.render(<NavMenu
                    header={this.props.navMenuHeader}
                    activeKey={this.state.activeTab}
                    items={this.getItems([...this.props.tabs ?? [], ...this.props.extraItems ?? []])}
                    onClickItem={(key) => this.handleTabChange(key)}
                    renderNames
                >
                    {
                        Array.isArray(this.state.renders) && [
                            this.state.renders.map((render, index) => {
                                return React.createElement(render.component, {
                                    ...render.options.props,
                                    ref: render.ref
                                })
                            })
                        ]
                    }
                </NavMenu>)
            }

            <div className="pagePanels">
                <div className="panel" ref={this.primaryPanelRef}>
                    {
                        this.renderActiveTab()
                    }
                </div>
            </div>
        </>
    }
}

export default PagePanelWithNavMenu