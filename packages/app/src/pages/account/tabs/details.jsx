import React from "react"
import { DateTime } from "luxon"
import { Skeleton } from "antd"
import { UserBadges } from "components"

import "./details.less"

import { Icons } from "components/Icons"

function getJoinLabel(jsDate) {
    const date = DateTime.fromJSDate(new Date(jsDate))

    const month = String(date.toLocaleString({ month: "long" })).toTitleCase()
    const year = String(date.year)

    return `${month} ${year}`
}

export default (props) => {
    return <div id="details" className="details">
        {
            props.state.user.roles.includes("admin") && <div className="inline_field">
                <div className="field_header">
                    <div className="field_icon">
                        <Icons.MdAdminPanelSettings />
                    </div>

                    <span>
                        Administrators Team
                    </span>
                </div>
            </div>
        }

        <div className="inline_field">
            <div className="field_header">
                <div className="field_icon">
                    <Icons.MdTag />
                </div>

                <span>
                    ID
                </span>
            </div>

            <div className="field_value">
                <p>
                    {props.state.user._id}
                </p>
            </div>
        </div>

        <div className="inline_field">
            <div className="field_header">
                <div className="field_icon">
                    <Icons.Users />
                </div>

                <span>
                    Followers
                </span>
            </div>

            <div className="field_value">
                <p>
                    {props.state.followers.length}
                </p>
            </div>
        </div>

        <div className="inline_field">
            <div className="field_header">
                <div className="field_icon">
                    <Icons.Calendar />
                </div>

                <span>
                    Joined at
                </span>
            </div>

            <div className="field_value">
                <p>
                    {
                        getJoinLabel(Number(props.state.user.createdAt))
                    }
                </p>
            </div>
        </div>

        <div className="inline_field">
            <div className="field_header">
                <div className="field_icon">
                    <Icons.Award />
                </div>

                <span>
                    Badges collected
                </span>
            </div>

            <div className="field_value">
                <p>
                    {props.state.user?.badges.length}
                </p>
            </div>
        </div>

        <React.Suspense fallback={<Skeleton />}>
            <UserBadges user_id={props.state.user?._id} />
        </React.Suspense>
    </div>
}