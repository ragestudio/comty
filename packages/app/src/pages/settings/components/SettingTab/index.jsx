import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"

import { Icons } from "components/Icons"

import {
    composedTabs,
    composeGroupsFromSettingsTab,
} from "schemas/settings"

import groupsDecorators from "schemas/settingsGroupsDecorators"

import SettingItemComponent from "../SettingItemComponent"

export default class SettingTab extends React.Component {
    state = {
        loading: true,
        processedCtx: {}
    }

    tab = composedTabs[this.props.activeKey]

    processCtx = async () => {
        if (typeof this.tab.ctxData === "function") {
            this.setState({ loading: true })

            const resultCtx = await this.tab.ctxData()

            console.log(resultCtx)

            this.setState({
                loading: false,
                processedCtx: resultCtx
            })
        }
    }

    // check if props.activeKey change 
    componentDidUpdate = async (prevProps) => {
        if (prevProps.activeKey !== this.props.activeKey) {
            this.tab = composedTabs[this.props.activeKey]

            this.setState({
                loading: !!this.tab.ctxData,
                processedCtx: {}
            })

            await this.processCtx()
        }
    }

    componentDidMount = async () => {
        this.setState({
            loading: !!this.tab.ctxData,
        })

        await this.processCtx()

        this.setState({
            loading: false
        })
    }

    render() {
        if (this.state.loading) {
            return <antd.Skeleton active />
        }

        if (this.tab.render) {
            return React.createElement(this.tab.render, {
                ctx: this.state.processedCtx
            })
        }

        if (this.props.withGroups) {
            const group = composeGroupsFromSettingsTab(this.tab.settings)

            return Object.entries(group).map(([groupKey, settings], index) => {
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
                            settings.map((setting) => <SettingItemComponent
                                setting={setting}
                                ctx={this.state.processedCtx}
                            />)
                        }
                    </div>
                </div>
            })
        }

        return this.tab.settings.map((setting, index) => {
            return <SettingItemComponent
                key={index}
                setting={setting}
                ctx={this.state.processedCtx}
            />
        })
    }
}