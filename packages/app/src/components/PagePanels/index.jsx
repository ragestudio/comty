import React from "react"
import classnames from "classnames"
import * as antd from "antd"

import { createIconRender } from "components/Icons"

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
        // if defaultTab is not set, try to get it from query, if not, use the first tab
        activeTab: this.props.defaultTab ?? new URLSearchParams(window.location.search).get("type") ?? this.props.tabs[0].key,
    }

    primaryPanelRef = React.createRef()

    renderActiveTab() {
        if (!Array.isArray(this.props.tabs)) {
            console.error("PagePanelWithNavMenu: tabs must be an array")
            return <></>
        }

        // slip the active tab by splitting on "."
        const activeTabDirectory = this.state.activeTab.split(".")

        let tab = null

        activeTabDirectory.forEach((key, index) => {
            if (!tab) {
                tab = this.props.tabs.find((children) => children.key === key)
            } else {
                console.log(tab.children)

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

        return React.createElement(tab.component)
    }

    replaceQueryTypeToCurrentTab = () => {
        app.history.replace(`${window.location.pathname}?type=${this.state.activeTab}`)
    }

    handleTabChange = async (key) => {
        if (this.state.activeTab === key) return

        if (this.props.transition) {
            // set to primary panel fade-opacity-leave class
            this.primaryPanelRef.current.classList.add("fade-opacity-leave")

            // remove fade-opacity-leave class after animation
            setTimeout(() => {
                this.primaryPanelRef.current.classList.remove("fade-opacity-leave")
            }, 300)

            await new Promise(resolve => setTimeout(resolve, 200))
        }

        if (this.props.onTabChange) {
            this.props.onTabChange(key)
        }

        this.setState({ activeTab: key })

        if (this.props.useSetQueryType) {
            this.replaceQueryTypeToCurrentTab()
        }
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
                children: <div className="card" id="navMenu">
                    {
                        this.props.navMenuHeader && <div className="header">
                            {this.props.navMenuHeader}
                        </div>
                    }

                    <antd.Menu
                        mode="inline"
                        selectedKeys={[this.state.activeTab]}
                        onClick={({ key }) => this.handleTabChange(key)}
                        items={this.getItems(this.props.tabs)}
                    />
                </div>
            },
            {
                props: {
                    ref: this.primaryPanelRef,
                    className: this.props.transition ? "fade-opacity-enter" : undefined,
                },
                children: this.renderActiveTab()
            },
        ]

        if (this.props.extraPanel) {
            panels.push(this.props.extraPanel)
        }

        return <PagePanels
            primaryPanelClassName={this.props.primaryPanelClassName}
            panels={panels}
        />
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
            className="pagePanels"
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