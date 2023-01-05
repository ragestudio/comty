import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import UserModel from "models/user"

import "./index.less"

export default (props) => {
    const [loading, setLoading] = React.useState(false)
    const [followers, setFollowers] = React.useState(props.followers ?? [])

    const goToProfile = (username) => {
        window.app.goToAccount(username)
    }

    const loadFollowers = async () => {
        setLoading(true)

        console.log(`Loading Followers for [${props.username ?? props.user_id}]...`)

        const followers = await UserModel.getUserFollowers({
            user_id: props.user_id,
        }).catch((err) => {
            console.error(err)
            app.message.error("Failed to fetch followers")

            return null
        })

        setLoading(false)

        if (followers) {
            console.log(`Loaded Followers: [${followers.length}] >`, followers)
            setFollowers(followers)
        }
    }

    React.useEffect(() => {
        if (props.username && !props.followers) {
            loadFollowers()
        }
    }, [])

    if (loading) {
        return <antd.Skeleton active />
    }

    if (followers.length === 0) {
        return <antd.Result
            icon={<Icons.UserX style={{ fontSize: "50px" }} />}
        >
            <h2>
                It's seems this user has no followers, yet.
            </h2>
            <h3>
                Maybe you can help them out?
            </h3>
        </antd.Result>
    }

    return <div className="followersList">
        {followers.map((follower) => {
            return <div className="follower" onClick={() => goToProfile(follower.username)}>
                <div className="avatar">
                    <antd.Avatar shape="square" src={follower.avatar} />
                </div>
                <div className="names">
                    <div>
                        <h2>
                            {follower.fullName ?? follower.username}
                        </h2>
                    </div>
                    <div>
                        <span>
                            @{follower.username}
                        </span>
                    </div>
                </div>
            </div>
        })}
    </div>
}