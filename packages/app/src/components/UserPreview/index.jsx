import React from "react"
import { Skeleton } from "antd"
import classnames from "classnames"

import User from "models/user"

import { Image } from "components"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    let [userData, setUserData] = React.useState(props.user)

    const fetchUser = async () => {
        if (!props.username) {
            console.error("Username is not defined")
            return false
        }

        const data = await User.data(props.username)

        if (data) {
            setUserData(data)
        }
    }

    const handleOnClick = async () => {
        if (typeof props.onClick !== "function") {
            console.warn("UserPreview: onClick is not a function")
            return
        }

        return await props.onClick(userData)
    }

    React.useEffect(() => {
        if (typeof userData === "undefined") {
            fetchUser()
        }
    }, [])

    if (!userData) {
        return <div className="userPreview">
            <Skeleton active />
        </div>
    }

    return <div
        className={classnames("userPreview", { ["clickable"]: typeof props.onClick === "function" })}
        onClick={handleOnClick}
    >
        <div className="avatar">
            <Image
                alt="Avatar"
                src={userData.avatar}
            />
        </div>
        <div className="info">
            <h1>
                {userData.fullName ?? `@${userData.username}`}
                {userData.verified && <Icons.verifiedBadge />}
            </h1>
        </div>
    </div>
}