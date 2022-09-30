import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    if (props.followers.length === 0) {
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
        {props.followers.map((follower) => {
            return <div className="follower">
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