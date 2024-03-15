import React from "react"
import * as antd from "antd"
import { createIconRender } from "components/Icons"
import { Translation } from "react-i18next"
import config from "config"

import useUrlQueryActiveKey from "hooks/useUrlQueryActiveKey"
import useUserRemoteConfig from "hooks/useUserRemoteConfig"

import {
    composedSettingsByGroups as settings
} from "schemas/settings"

import menuGroupsDecorators from "schemas/settingsMenuGroupsDecorators"

import SettingTab from "./components/SettingTab"

import "./index.less"

const extraMenuItems = [
    {
        key: "donate",
        label: <div style={{
            color: "#f72585"
        }}>
            {createIconRender("Heart")}
            Support us
        </div>,
    },
    {
        key: "logout",
        label: <div>
            {createIconRender("MdOutlineLogout")}
            Logout
        </div>,
        danger: true,
    }
]

const menuEvents = {
    "donate": () => {
        if (config.fundingLink) {
            window.open(config.fundingLink, "_blank")
        }
    },
    "logout": () => {
        app.eventBus.emit("app.logout_request")
    }
}

const generateMenuItems = () => {
    return settings.map((entry, index) => {
        const children = entry.groupModule.map((item) => {
            return {
                key: item.id,
                type: "item",
                label: <div {...item.props}>
                    {createIconRender(item.icon ?? "Settings")}
                    {item.label}
                </div>,
                danger: item.danger,
                disabled: item.disabled,
            }
        })

        if (index !== settings.length - 1) {
            children.push({
                type: "divider",
            })
        }

        return {
            key: entry.group,
            type: "group",
            children: children,
            label: entry.group === "bottom" ? null : <>
                {
                    menuGroupsDecorators[entry.group]?.icon && createIconRender(menuGroupsDecorators[groupKey]?.icon ?? "Settings")
                }
                <Translation>
                    {
                        t => t(menuGroupsDecorators[entry.group]?.label ?? entry.group)
                    }
                </Translation>
            </>
        }
    })
}

export default () => {
    const [config, setConfig, loading] = useUserRemoteConfig()
    const [activeKey, setActiveKey] = useUrlQueryActiveKey({
        defaultKey: "general",
        queryKey: "tab"
    })

    const onChangeTab = (event) => {
        if (typeof menuEvents[event.key] === "function") {
            return menuEvents[event.key]()
        }

        app.cores.sound.useUIAudio("navigation")

        setActiveKey(event.key)
    }

    const menuItems = React.useMemo(() => {
        const items = generateMenuItems()

        extraMenuItems.forEach((item) => {
            items[settings.length - 1].children.push(item)
        })

        return items
    }, [])

    function handleOnUpdate(key, value) {
        setConfig({
            ...config,
            [key]: value
        })
    }

    return <div className="settings_wrapper">
        <div className="settings_menu">
            <antd.Menu
                mode="vertical"
                items={menuItems}
                onClick={onChangeTab}
                selectedKeys={[activeKey]}
            />
        </div>

        <div className="settings_content">
            {
                loading && <antd.Skeleton active />
            }
            {
                !loading && <SettingTab
                    baseConfig={config}
                    onUpdate={handleOnUpdate}
                    activeKey={activeKey}
                    withGroups
                />
            }
        </div>
    </div>
}