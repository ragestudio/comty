import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { Icons, createIconRender } from "components/Icons"
import { Image, UserBadges, FollowButton } from "components"

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

const UserLinkViewer = (props) => {
    const { link, decorator } = props

    return <div className="userLinkViewer">
        <div className="userLinkViewer_icon">
            {
                createIconRender(decorator.icon ?? "MdLink")
            }
        </div>

        <div className="userLinkViewer_value">
            <p>
                {
                    link.value
                }
            </p>
        </div>
    </div>

}

const UserLink = (props) => {
    let { index, link } = props

    link.key = link.key.toLowerCase()

    const decorator = linksDecorators[link.key] ?? {}

    link.value = processValue(link.value, decorator)

    const hasHref = String(link.value).includes("://")

    const handleOnClick = () => {
        if (!hasHref) {
            if (app.isMobile) {
                app.DrawerController.open("link_viewer", UserLinkViewer, {
                    componentProps: {
                        link: link,
                        decorator: decorator
                    }
                })
            }
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

        {
            !app.isMobile && <p>
                {
                    renderName()
                }
            </p>
        }
    </div>
}

export const UserCard = React.forwardRef((props, ref) => {
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
            <div className="username_text">
                <h1>
                    {user.fullName || user.username}
                    {user.verified && <Icons.verifiedBadge />}
                </h1>
                <span>
                    @{user.username}
                </span>
            </div>

            <UserBadges user_id={user._id} />
        </div>

        <div className="description">
            <h3>
                {user.description}
            </h3>
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

export const MobileUserCard = React.forwardRef((props, ref) => {
    return <div
        ref={ref}
        className={classnames(
            "_mobile_userCard",
            {
                ["no-cover"]: !props.user.cover
            }
        )}
    >
        <div className="_mobile_userCard_top">
            {
                props.user.cover && <div className="_mobile_userCard_top_cover">
                    <div
                        className="cover"
                        style={{
                            backgroundImage: `url("${props.user.cover}")`
                        }}
                    />

                    <div className="_mobile_userCard_top_avatar_wrapper">
                        <div className="_mobile_userCard_top_avatar">
                            <Image
                                src={props.user.avatar}
                            />
                        </div>
                    </div>
                </div>
            }

            {
                !props.user.cover && <div className="_mobile_userCard_top_avatar">
                    <Image
                        src={props.user.avatar}
                    />
                </div>
            }

            <div className="_mobile_userCard_top_texts">
                <div className="_mobile_userCard_top_username">
                    <h1>
                        {
                            props.user.fullName ?? `@${props.user.username}`
                        }
                        {
                            props.user.verified && <Icons.verifiedBadge />
                        }
                    </h1>

                    {
                        props.user.fullName && <span>
                            @{props.user.username}
                        </span>
                    }
                </div>

                <div className="_mobile_userCard_top_description">
                    <p>
                        {
                            props.user.description
                        }
                    </p>
                </div>
            </div>

            {
                props.user.links
                && Array.isArray(props.user.links)
                && props.user.links.length > 0
                && <div
                    className={classnames(
                        "_mobile_userCard_links",
                    )}
                >
                    {
                        props.user.links.map((link, index) => {
                            return <UserLink index={index} link={link} />
                        })
                    }
                </div>
            }
        </div>

        <div
            className={classnames(
                "_mobile_card",
                "_mobile_userCard_actions",
            )}
        >
            {
                props.followers && <FollowButton
                    count={props.followers.length}
                    onClick={props.onClickFollow}
                    followed={props.isFollowed}
                    self={props.isSelf}
                />
            }

            <antd.Button
                type="primary"
                icon={<Icons.MdMessage />}
                disabled
            />

            <antd.Button
                type="primary"
                icon={<Icons.MdShare />}
            />
        </div>
    </div>
})

export default UserCard