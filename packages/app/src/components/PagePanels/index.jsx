import React from "react"
import classnames from "classnames"
import * as antd from "antd"

import { createIconRender } from "components/Icons"

import NavMenu from "./components/NavMenu"

import "./index.less"

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
        activeTab: this.props.defaultTab ?? new URLSearchParams(window.location.search).get("type") ?? this.props.tabs[0].key,
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
            app.layout.top_bar.shouldUseTopBarSpacer(false)
        }

        app.layout.toggleCenteredContent(true)
    }

    componentWillUnmount() {
        delete app.layout.page_panels

        if (app.isMobile) {
            app.layout.top_bar.shouldUseTopBarSpacer(true)
        }
    }

    renderActiveTab() {
        if (!Array.isArray(this.props.tabs)) {
            console.error("PagePanelWithNavMenu: tabs must be an array")
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

        return React.createElement(tab.component, componentProps)
    }

    replaceQueryTypeToCurrentTab = () => {
        app.history.replace(`${window.location.pathname}?type=${this.state.activeTab}`)
    }

    tabChange = async (key) => {
        if (this.props.beforeTabChange) {
            await this.props.beforeTabChange(key)
        }

        await this.setState({ activeTab: key })

        if (this.props.useSetQueryType) {
            this.replaceQueryTypeToCurrentTab()
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

            // set to primary panel fade-opacity-leave class
            this.primaryPanelRef.current.classList.add("fade-opacity-leave")

            // remove fade-opacity-leave class after animation
            setTimeout(() => {
                this.primaryPanelRef.current.classList.remove("fade-opacity-leave")
            }, 300)

            await new Promise(resolve => setTimeout(resolve, 200))
        }

        return this.tabChange(key)
    }

    getItems = (items) => {
        if (!Array.isArray(items)) {
            console.error(`[items] is not an (array), received (${typeof items})`)
            return []
        }

        return items.map((item) => {
            return {
                key: item.key,
                icon: createIconRender(item.icon),
                label: item.label,
                children: item.children && this.getItems(item.children),
                disabled: item.disabled,
            }
        })
    }

    render() {
        const panels = [
            {
                children: <>
                    <NavMenu
                        header={this.props.navMenuHeader}
                        activeKey={this.state.activeTab}
                        items={this.getItems(this.props.tabs)}
                        onClickItem={(key) => this.handleTabChange(key)}
                    />

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
                </>
            },
            {
                props: {
                    ref: this.primaryPanelRef,
                    className: this.props.transition ? "fade-opacity-enter" : undefined,
                },
                children: this.renderActiveTab()
            },
        ]

        if (app.isMobile) {
            delete panels[0]
        }

        if (this.props.extraPanel) {
            panels.push(this.props.extraPanel)
        }

        return <>
            {
                app.isMobile && app.layout.top_bar.render(<NavMenu
                    activeKey={this.state.activeTab}
                    items={this.getItems(this.props.tabs)}
                    onClickItem={(key) => this.handleTabChange(key)}
                />)
            }
            <PagePanels
                primaryPanelClassName={this.props.primaryPanelClassName}
                panels={panels}
                masked={this.props.masked}
                no_top_padding={this.props.no_top_padding}
            />
        </>
    }
}

export default class PagePanels extends React.Component {
    generateGridStyle = () => {
        switch (this.props.panels.length) {
            case 1: {
                return {
                    gridTemplateColumns: "1fr",
                }
            }
            case 2: {
                return {
                    gridTemplateColumns: "1fr 3fr",
                }
            }
            case 3: {
                return {
                    gridTemplateColumns: "0.5fr 1fr 0.5fr",
                }
            }
        }
    }

    render() {
        if (!this.props.panels) {
            return null
        }

        return <div
            className={classnames(
                "pagePanels",
                {
                    ["masked"]: this.props.masked,
                    ["withTopPadding"]: !!!this.props.no_top_padding
                }
            )}
            style={this.generateGridStyle()}
        >
            {
                this.props.panels[0] && <Panel
                    {...this.props.panels[0]}
                    align="left"
                />
            }
            {
                this.props.panels[1] && <Panel
                    {...this.props.panels[1]}
                    className={this.props.primaryPanelClassName}
                    align="center"
                />
            }
            {
                this.props.panels[2] && <Panel
                    {...this.props.panels[2]}
                    align="right"
                />
            }
        </div>
    }
}