import React from "react"
import * as antd from "antd"

import { Icons } from "components/Icons"
import { Image, UserBadges } from "components"

import "./index.less"

export default React.forwardRef((props, ref) => {
    const [user, setUser] = React.useState(props.user)

    // TODO: Support API user data fetching 

    return <div
        className="userCard"
        ref={ref}
    >
        <div className="avatar">
            <Image
                src={user.avatar}
            />
        </div>

        <div className="username">
            <div>
                <h1>
                    {user.fullName || user.username}
                    {user.verified && <Icons.verifiedBadge />}
                </h1>
                <span>
                    @{user.username}
                </span>
            </div>

            <div className="indicators">
                {
                    user.roles.includes("admin") &&
                    <antd.Tooltip title="Administrators Team">
                        <Icons.MdAdminPanelSettings />
                    </antd.Tooltip>
                }
                {
                    user.early_supporter &&
                    <antd.Tooltip title="Early supporter">
                        <Icons.MdLoyalty />
                    </antd.Tooltip>
                }
            </div>
        </div>

        <div className="description">
            <h3>
                {user.description}
            </h3>
        </div>

        <div className="badges">
            <React.Suspense fallback={<antd.Skeleton />}>
                <UserBadges user_id={user._id} />
            </React.Suspense>
        </div>
    </div>
})