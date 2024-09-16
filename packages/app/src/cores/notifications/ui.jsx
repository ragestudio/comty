import React from "react"
import { Translation } from "react-i18next"
import { notification as Notf, Space, Button } from "antd"

import { Icons, createIconRender } from "@components/Icons"

class NotificationUI {
    static async notify(notification) {
        if (typeof notification === "string") {
            notification = {
                title: "New notification",
                description: notification
            }
        }

        const notfObj = {
            duration: typeof notification.duration === "undefined" ? 4 : notification.duration,
            key: notification.key ?? Date.now(),
        }

        if (notification.title) {
            switch (typeof notification.title) {
                case "function": {
                    notfObj.message = React.createElement(notification.title)

                    break
                }
                case "object": {
                    notfObj.message = notification.title

                    break
                }
                default: {
                    notfObj.message = <Translation>
                        {(t) => t(notification.title)}
                    </Translation>

                    break
                }
            }
        }

        if (notification.description) {
            switch (typeof notification.description) {
                case "function": {
                    notfObj.description = React.createElement(notification.description)

                    break
                }

                case "object": {
                    notfObj.description = notification.description

                    break
                }

                default: {
                    notfObj.description = <Translation>
                        {(t) => t(notification.description)}
                    </Translation>

                    break
                }
            }
        }

        if (notification.icon) {
            notfObj.icon = React.isValidElement(notification.icon) ? notification.icon : (createIconRender(notification.icon) ?? <Icons.FiBell />)
        }

        if (Array.isArray(notification.actions)) {
            notfObj.btn = (
                <Space>
                    {
                        notification.actions.map((action, index) => {
                            const handleClick = () => {
                                if (typeof action.onClick === "function") {
                                    action.onClick()
                                }

                                if (!action.keepOpenOnClick) {
                                    Notf.destroy(notfObj.key)
                                }
                            }

                            return <Button
                                key={index}
                                type={action.type ?? "primary"}
                                onClick={handleClick}
                            >
                                {action.label}
                            </Button>
                        })
                    }
                </Space>
            )
        }

        if (typeof notification.closable) {
            notfObj.closable = notification.closable
        }

        if (notification.type === "loading") {
            notification.type = "open"
            notfObj.icon = <Icons.LoadingOutlined />
        }

        if (typeof Notf[notification.type] !== "function") {
            notification.type = "info"
        }

        return Notf[notification.type](notfObj)
    }

    static close(key) {
        Notf.destroy(key)
    }
}

export default NotificationUI