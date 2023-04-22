import React from "react"
import * as antd from "antd"

import { Icons, createIconRender } from "components/Icons"
import { Image, UserBadges } from "components"

import linksDecorators from "schemas/userLinksDecorators"

import "./index.less"

function processValue(value, decorator) {
    if (decorator.hrefResolve) {
        if (!String(value).includes(decorator.hrefResolve)) {
            return `${decorator.hrefResolve}${value}`
        }
    }

    return value
}

const UserLink = (props) => {
    let { index, link } = props

    link.key = link.key.toLowerCase()

    const decorator = linksDecorators[link.key] ?? {}

    link.value = processValue(link.value, decorator)

    const hasHref = String(link.value).includes("://")

    const handleOnClick = () => {
        if (!hasHref) {
            return false
        }

        window.open(link.value, "_blank")
    }

    const renderName = () => {
        if (decorator.hrefResolve) {
            return decorator.label ?? link.value
        }

        return link.value
    }

    return <div
        key={index}
        id={`link-${index}-${link.key}`}
        className={`userLink ${hasHref ? "clickable" : ""}`}
        onClick={handleOnClick}
    >
        {
            createIconRender(decorator.icon ?? "MdLink")
        }

        <p>
            {
                renderName()
            }
        </p>
    </div>
}

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
                        <Icons.FaCertificate
                            style={{
                                fontSize: "1em",
                            }}
                        />
                    </antd.Tooltip>
                }
                {
                    user.early_supporter &&
                    <antd.Tooltip title="Early supporter">
                        <Icons.MdLoyalty />
                    </antd.Tooltip>
                }
                {
                    user.roles.includes("internal_dev") &&
                    <antd.Tooltip title="Internal developer">
                        <Icons.MdCode />
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

        {
            user.links && Array.isArray(user.links) && user.links.length > 0 && <div className="userLinks">
                {
                    user.links.map((link, index) => {
                        return <UserLink index={index} link={link} />
                    })
                }
            </div>
        }
    </div>
})