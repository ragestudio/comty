import React from "react"
import * as antd from "antd"

import { Translation } from "react-i18next"
import useUrlQueryActiveKey from "hooks/useUrlQueryActiveKey"

import { Icons, createIconRender } from "components/Icons"

import {
    composedSettingsByGroups as settingsGroups,
    composedTabs,
} from "schemas/settings"

import menuGroupsDecorators from "schemas/settingsMenuGroupsDecorators"
import SettingTab from "./components/SettingTab"

import "./index.mobile.less"

const SettingsHeader = ({
    activeKey,
    back = () => { }
} = {}) => {
    if (activeKey) {
        const currentTab = composedTabs[activeKey]

        return <div className="__mobile__settings_header nav">
            <antd.Button
                icon={<Icons.MdChevronLeft />}
                onClick={back}
                size="large"
                type="ghost"
            />

            <h1>
                {
                    createIconRender(currentTab?.icon)
                }
                <Translation>
                    {(t) => t(currentTab?.label ?? activeKey)}
                </Translation>
            </h1>
        </div>
    }

    return <div className="__mobile__settings_header">
        <h1>
            {
                createIconRender("Settings")
            }
            <Translation>
                {(t) => t("Settings")}
            </Translation>
        </h1>
    </div>
}

export default (props) => {
    let lastKey = null

    const [activeKey, setActiveKey] = useUrlQueryActiveKey({
        queryKey: "tab",
        defaultKey: null,
    })

    const handleTabChange = (key) => {
        // star page transition using new chrome transition api
        if (document.startViewTransition) {
            return document.startViewTransition(() => {
                changeTab(key)
            })
        }

        return changeTab(key)
    }

    const goBack = () => {
        handleTabChange(lastKey)
    }

    const changeTab = (key) => {
        lastKey = key
        setActiveKey(key)
    }

    return <div className="__mobile__settings">
        <SettingsHeader
            activeKey={activeKey}
            back={goBack}
        />

        <div className="settings_list">
            {
                !activeKey && settingsGroups.map((entry) => {
                    const groupDecorator = menuGroupsDecorators[entry.group]

                    return <div className="settings_list_group">
                        <span >
                            <Translation>
                                {(t) => t(groupDecorator?.label ?? entry.group)}
                            </Translation>
                        </span>

                        <div className="settings_list_group_items">
                            {
                                entry.groupModule.map((settingsModule, index) => {
                                    return <antd.Button
                                        size="large"
                                        key={settingsModule.id}
                                        id={settingsModule.id}
                                        icon={createIconRender(settingsModule.icon)}
                                        onClick={() => {
                                            handleTabChange(settingsModule.id)
                                        }}
                                    >
                                        <Translation>
                                            {(t) => t(settingsModule.label)}
                                        </Translation>
                                    </antd.Button>
                                })
                            }
                        </div>
                    </div>
                })
            }

            {
                activeKey && <div className="settings_list_render">
                    <SettingTab
                        activeKey={activeKey}
                    />
                </div>
            }
        </div>
    </div>
}
