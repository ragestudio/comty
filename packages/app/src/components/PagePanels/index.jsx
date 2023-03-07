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
        activeTab: this.props.defaultTab ?? new URLSearchParams(window.location.search).get("type") ?? Object.keys(this.props.tabs)[0],
    }

    primaryPanelRef = React.createRef()

    renderActiveTab() {
        const tab = this.props.tabs[this.state.activeTab]

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
                    >
                        {
                            Object.entries(this.props.tabs ?? []).map(([key, tab]) => {
                                return <antd.Menu.Item
                                    key={key}
                                    disabled={tab.disabled}
                                    danger={tab.danger}
                                >
                                    {tab.icon && createIconRender(tab.icon)}
                                    {tab.label}
                                </antd.Menu.Item>
                            })
                        }
                    </antd.Menu>
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
                    gridTemplateColumns: "1fr 1fr 1fr",
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