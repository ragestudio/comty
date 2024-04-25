import React from "react"
import classnames from "classnames"

import { DateTime } from "luxon"
import { Skeleton } from "antd"

import UserBadges from "@components/UserBadges"
import { Icons } from "@components/Icons"

import "./index.less"

function getJoinLabel(jsDate) {
    const date = DateTime.fromJSDate(new Date(jsDate))

    const month = String(date.toLocaleString({ month: "long" })).toTitleCase()
    const year = String(date.year)

    return `${month} ${year}`
}

const DroppableField = (props) => {
    const [collapsed, setCollapsed] = React.useState(true)

    return <div
        className={classnames(
            "droppableField",
            {
                ["collapsed"]: collapsed
            }
        )}
        onClick={() => setCollapsed(!collapsed)}
    >
        <div className="collapse_btn">
            {
                collapsed
                    ? <Icons.ChevronDown />
                    : <Icons.ChevronUp />
            }
        </div>
        <div className="inline_field">
            {
                props.header
            }
        </div>

        <div className="field_body">
            {
                props.children
            }
        </div>
    </div>
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
                    {props.state.followersCount}
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
                        getJoinLabel(Number(props.state.user.created_at ?? props.state.user.createdAt))
                    }
                </p>
            </div>
        </div>

        <DroppableField
            header={<>
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
            </>}
        >
            <React.Suspense fallback={<Skeleton />}>
                <UserBadges user_id={props.state.user?._id} />
            </React.Suspense>
        </DroppableField>
    </div>
}