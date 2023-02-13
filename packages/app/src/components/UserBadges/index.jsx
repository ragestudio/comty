import React from "react"
import * as antd from "antd"
import Loadable from "react-loadable"

import { createIconRender } from "components/Icons"
import { UserModel } from "models"

export default React.memo((props) => {
    return React.createElement(Loadable({
        loader: async () => {
            let { user_id } = props

            const badgesData = await UserModel.getUserBadges(user_id).catch((err) => {
                console.error(err)

                app.message.error("Failed to fetch user badges")

                return null
            })

            if (!badgesData) {
                return null
            }

            return () => badgesData.map((badge, index) => {
                return <antd.Tooltip placement="bottom" title={badge.description ?? "An badge"}>
                    <antd.Tag
                        color={badge.color ?? "default"}
                        key={index}
                        id={badge.name}
                        icon={createIconRender(badge.icon)}
                        className="badge"
                    >
                        <span>{badge.label}</span>
                    </antd.Tag>
                </antd.Tooltip>
            })
        },
        loading: antd.Skeleton,
    }))
})