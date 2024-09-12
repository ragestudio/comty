import React from "react"
import * as antd from "antd"

import Image from "@components/Image"
import UserBadges from "@components/UserBadges"
import { Icons, createIconRender } from "@components/Icons"

import ContrastYIQ from "@utils/contrastYIQ"

import "./index.less"

const UserShareBadge = (props) => {
    const { user } = props

    const [loading, setLoading] = React.useState(true)
    const [contrastColor, setContrastColor] = React.useState(null)

    async function initialize(params) {
        setLoading(true)

        const contrastYIQ = await ContrastYIQ.fromUrl(user.cover)

        setContrastColor(contrastYIQ)

        setLoading(false)
    }

    React.useEffect(() => {
        initialize()
    }, [])

    if (loading) {
        return <div className="user-share-badge">
            <antd.Skeleton active />
        </div>
    }

    return <div
        className="user-share-badge"
        style={{
            backgroundImage: `url("${user.cover}")`,
            color: contrastColor
        }}
    >
        <div className="user-share-badge-info">
            <div className="user-share-badge-avatar">
                <Image
                    src={user.avatar}
                />
            </div>

            <div className="user-share-badge-username">
                <h1>
                    {user.public_name || user.username}
                    {user.verified && <Icons.verifiedBadge />}
                </h1>
                <span>
                    @{user.username}
                </span>
            </div>

            {
                user.badges?.length > 0 && <UserBadges user_id={user._id} />
            }
        </div>
    </div>
}

export default UserShareBadge