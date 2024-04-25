import React from "react"
import { Translation } from "react-i18next"
import { notification as Notf, Space, Button } from "antd"

import { Icons, createIconRender } from "@components/Icons"

class NotificationUI {
    static async notify(
        notification,
        options = {
            type: "info"
        }
    ) {
        if (typeof notification === "string") {
            notification = {
                title: "New notification",
                description: notification
            }
        }

        const notfObj = {
            duration: options.duration ?? 4,
            key: options.key ?? Date.now(),
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
            notfObj.icon = React.isValidElement(notification.icon) ? notification.icon : (createIconRender(notification.icon) ?? <Icons.Bell />)
        }

        if (Array.isArray(options.actions)) {
            notfObj.btn = (
                <Space>
                    {
                        options.actions.map((action, index) => {
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

        if (typeof Notf[options.type] !== "function") {
            options.type = "info"
        }

        return Notf[options.type](notfObj)
    }
}

export default NotificationUI