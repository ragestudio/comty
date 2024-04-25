import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"

import { Icons } from "@components/Icons"

import {
    composedTabs,
    composeGroupsFromSettingsTab,
} from "@/settings"

import groupsDecorators from "@config/settingsGroupsDecorators"

import SettingItemComponent from "../SettingItemComponent"

export default class SettingTab extends React.Component {
    state = {
        loading: true,
        tab: null,
        ctx: {},
    }

    loadTab = async () => {
        await this.setState({
            loading: true,
            processedCtx: {},
        })

        const tab = composedTabs[this.props.activeKey]

        let ctx = {}

        if (typeof tab.ctxData === "function") {
            ctx = await tab.ctxData()
        }

        await this.setState({
            tab: tab,
            loading: false,
            ctx: {
                baseConfig: this.props.baseConfig,
                ...ctx
            },
        })
    }

    // check if props.activeKey change 
    componentDidUpdate = async (prevProps) => {
        if (prevProps.activeKey !== this.props.activeKey) {
            await this.loadTab()
        }
    }

    componentDidMount = async () => {
        await this.loadTab()
    }

    handleSettingUpdate = async (key, value) => {
        if (typeof this.props.onUpdate === "function") {
            await this.props.onUpdate(key, value)
        }
    }

    render() {
        if (this.state.loading) {
            return <antd.Skeleton active />
        }

        const { ctx, tab } = this.state

        if (tab.render) {
            return React.createElement(tab.render, {
                ctx: ctx,
            })
        }

        if (this.props.withGroups) {
            const group = composeGroupsFromSettingsTab(tab.settings)

            return <>
                {
                    Object.entries(group).map(([groupKey, settings], index) => {
                        const fromDecoratorIcon = groupsDecorators[groupKey]?.icon
                        const fromDecoratorTitle = groupsDecorators[groupKey]?.title

                        return <div id={groupKey} key={index} className="settings_content_group">
                            <div className="settings_content_group_header">
                                <h1>
                                    {
                                        fromDecoratorIcon ? React.createElement(Icons[fromDecoratorIcon]) : null
                                    }
                                    <Translation>
                                        {
                                            t => t(fromDecoratorTitle ?? groupKey)
                                        }
                                    </Translation>
                                </h1>
                            </div>

                            <div className="settings_list">
                                {
                                    settings.map((setting, index) => <SettingItemComponent
                                        key={index}
                                        setting={setting}
                                        ctx={ctx}
                                        onUpdate={(value) => this.handleSettingUpdate(setting.id, value)}
                                    />)
                                }
                            </div>
                        </div>
                    })
                }

                {
                    tab.footer && React.createElement(tab.footer, {
                        ctx: this.state.ctx
                    })
                }
            </>
        }

        return <>
            {
                tab.settings.map((setting, index) => {
                    return <SettingItemComponent
                        key={index}
                        setting={setting}
                        ctx={{
                            ...this.state.ctx,
                            baseConfig: this.props.baseConfig,
                        }}
                        onUpdate={(value) => this.handleSettingUpdate(setting.id, value)}
                    />
                })
            }

            {
                tab.footer && React.createElement(tab.footer, {
                    ctx: this.state.ctx
                })
            }
        </>
    }
}