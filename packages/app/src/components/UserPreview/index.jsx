import React from "react"
import classnames from "classnames"

import { Image } from "components"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const { user } = props

    const handleOnClick = async () => {
        if (typeof props.onClick !== "function") {
            console.warn("UserPreview: onClick is not a function")
            return
        }

        return await props.onClick(user)
    }

    return <div
        className={classnames("userPreview", { ["clickable"]: typeof props.onClick === "function" })}
        onClick={handleOnClick}
    >
        <div className="avatar">
            <Image
                alt="Avatar"
                src={user.avatar}
            />
        </div>
        <div className="info">
            <h1>
                {user.fullName ?? `@${user.username}`}
                {user.verified && <Icons.verifiedBadge />}
            </h1>
        </div>
    </div>
}